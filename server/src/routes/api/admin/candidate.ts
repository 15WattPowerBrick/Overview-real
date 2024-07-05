import { Router, Request, Response } from "express";
import { prisma } from "../../../client";
import { PrismaError } from "@/types";
import {
  CommonAddress,
  BankDetails,
  EmergencyContact,
  User,
} from "@/types/common";
import bcrypt from "bcrypt";
import { maskNRIC } from "../../../utils";
import {
  PERMISSION_ERROR_TEMPLATE,
  checkPermission,
  PermissionList,
} from "../../../utils/permissions";

const candidateAPIRoutes: Router = Router();

candidateAPIRoutes.get(
  "/candidate/:candidateCuid",
  async (req: Request, res: Response) => {
    const user = req.user as User;
    const { candidateCuid } = req.params;

    if (user.userType !== "Admin") {
      // TODO: redirect request to user api endpoint
    }

    try {
      const {
        cuid,
        name,
        nric,
        contact,
        dateOfBirth,
        emergencyContact,
        ...otherData
      } = await prisma.candidate.findUniqueOrThrow({
        where: {
          cuid: candidateCuid,
        },
      });

      const hasReadCandidateDetailsPermission = await checkPermission(
        user.cuid,
        PermissionList.CAN_READ_CANDIDATE_DETAILS
      );

      if (hasReadCandidateDetailsPermission) {
        return res.send({
          cuid: candidateCuid,
          name,
          nric,
          contact,
          dateOfBirth,
          emergencyContact,
          ...otherData,
        });
      }

      return res.send({
        cuid: candidateCuid,
        name,
        nric: maskNRIC(nric),
        contact,
        dateOfBirth,
        emergencyContact,
      });
    } catch (error) {
      return res.status(404).send("Candidate not found.");
    }
  }
);

candidateAPIRoutes.get("/candidate/nric/:candidateNric", async (req, res) => {
  const user = req.user as User;
  const { candidateNric } = req.params;

  if (user.userType !== "Admin") {
    res.status(401).send("Unauthorized");
  }

  try {
    const candidate = await prisma.candidate.findUnique({
      where: {
        nric: candidateNric,
      },
    });

    if (!candidate) {
      console.log("Candidate not found.");
      return res.status(404).send("Candidate not found.");
    }

    return res.send({
      nric: candidate.nric,
      name: candidate.name,
      cuid: candidate.cuid,
      contact: candidate.contact,
      dateOfBirth: candidate.dateOfBirth,
    });
  } catch (error) {
    return res.status(404).send("Candidate not found.");
  }
});

candidateAPIRoutes.post("/candidate", async (req, res) => {
  const {
    nric,
    name,
    contact,
    nationality,
    dateOfBirth,
    bankDetails,
    address,
    emergencyContact,
  } = req.body;

  // Checking for the required parameters
  if (!nric) return res.status(400).send("nric parameter is required.");

  if (!name) return res.status(400).send("name parameter is required.");

  if (!contact) return res.status(400).send("contact parameter is required.");

  // Validation for dateOfBirth
  if (dateOfBirth && !Date.parse(dateOfBirth)) {
    return res.status(400).send("Invalid dateOfBirth parameter.");
  }

  // Validation for bankDetails
  let bankDetailsObject: BankDetails | undefined;
  if (bankDetails) {
    try {
      bankDetailsObject = JSON.parse(bankDetails) as BankDetails;
      if (
        !bankDetailsObject.bankHolderName ||
        !bankDetailsObject.bankName ||
        !bankDetailsObject.bankNumber
      ) {
        throw new Error();
      }
    } catch (error) {
      return res.status(400).send("Invalid bankDetails JSON.");
    }
  }

  // Validation for address
  let addressObject: CommonAddress | undefined;
  if (address) {
    try {
      addressObject = JSON.parse(address) as CommonAddress;
      if (
        !addressObject.block ||
        !addressObject.building ||
        !addressObject.floor ||
        !addressObject.unit ||
        !addressObject.street ||
        !addressObject.postal ||
        !addressObject.country
      ) {
        throw new Error();
      }
    } catch (error) {
      return res.status(400).send("Invalid address JSON.");
    }
  }

  // Validation for emergencyContact
  let emergencyContactObject: EmergencyContact | undefined;
  if (emergencyContact) {
    try {
      emergencyContactObject = JSON.parse(emergencyContact) as EmergencyContact;
      if (
        !emergencyContactObject.name ||
        !emergencyContactObject.relationship ||
        !emergencyContactObject.contact
      ) {
        throw new Error();
      }
    } catch (error) {
      return res.status(400).send("Invalid emergencyContact JSON.");
    }
  }

  const createData = {
    nric,
    name,
    contact,
    ...(nationality && { nationality }),
    ...(dateOfBirth && { dateOfBirth }),
    ...(addressObject && { address: { update: addressObject } }),
    ...(bankDetailsObject && { bankDetails: { update: bankDetailsObject } }),
    ...(emergencyContactObject && {
      emergencyContact: { update: emergencyContactObject },
    }),
  };

  try {
    await prisma.candidate.create({
      data: {
        ...createData,
        User: {
          create: {
            username: nric,
            hash: await bcrypt.hash(contact, 12),
          },
        },
      },
    });
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === "P2002") {
      const prismaErrorMetaTarget = prismaError.meta.target || [];

      if (prismaErrorMetaTarget.includes("nric")) {
        return res.status(400).send("Candidate already exists.");
      }

      if (prismaErrorMetaTarget.includes("contact")) {
        return res.status(400).send("Another candidate has the same contact.");
      }
    }

    console.log(error);
    return res.status(500).send("Internal server error.");
  }

  return res.send(`Candidate ${nric} created successfully.`);
});

candidateAPIRoutes.delete("/candidate", async (req, res) => {
  const user = req.user as User;
  const { cuid } = req.body;

  if (!cuid) return res.status(400).send("cuid parameter is required.");

  const hasDeleteCandidatePermission = await checkPermission(
    user.cuid,
    PermissionList.CAN_DELETE_CANDIDATES
  );

  if (!hasDeleteCandidatePermission) {
    return res
      .status(401)
      .send(PERMISSION_ERROR_TEMPLATE + PermissionList.CAN_DELETE_CANDIDATES);
  }

  try {
    await prisma.candidate.delete({
      where: {
        cuid,
        Assign: {
          none: {},
        },
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error.");
  }

  return res.send(`Candidate ${cuid} deleted successfully.`);
});

candidateAPIRoutes.patch("/candidate", async (req, res) => {
  const user = req.user as User;
  const {
    cuid,
    name,
    contact,
    nationality,
    dateOfBirth,
    bankDetails,
    address,
    emergencyContact,
  } = req.body;

  // Checking for the required identifier
  if (!cuid) return res.status(400).send("cuid parameter is required.");

  if (
    !name &&
    !contact &&
    !nationality &&
    !dateOfBirth &&
    !bankDetails &&
    !address &&
    !emergencyContact
  ) {
    return res
      .status(400)
      .send(
        "At least one field (name, contact, nationality, dateOfBirth, bankDetails, address, emergencyContact) is required."
      );
  }

  const hasUpdateCandidatePermission = await checkPermission(
    user.cuid,
    PermissionList.CAN_UPDATE_CANDIDATES
  );

  if (!hasUpdateCandidatePermission) {
    return res
      .status(401)
      .send(PERMISSION_ERROR_TEMPLATE + PermissionList.CAN_UPDATE_CANDIDATES);
  }

  // Validation for dateOfBirth
  if (dateOfBirth && !Date.parse(dateOfBirth)) {
    return res.status(400).send("Invalid dateOfBirth parameter.");
  }

  // Validation for bankDetails
  if (
    bankDetails &&
    (!bankDetails.bankHolderName ||
      !bankDetails.bankName ||
      !bankDetails.bankNumber)
  ) {
    return res.status(400).send("Invalid bankDetails JSON.");
  }
  // Validation for address
  if (
    address &&
    (!address.block ||
      !address.building ||
      !address.street ||
      !address.postal ||
      !address.country ||
      (!address.isLanded && !(address.floor || address.unit)))
  ) {
    return res.status(400).send("Invalid address JSON.");
  }

  // Validation for emergencyContact
  if (
    emergencyContact &&
    (!emergencyContact.name ||
      !emergencyContact.relationship ||
      !emergencyContact.contact)
  ) {
    return res.status(400).send("Invalid emergencyContact JSON.");
  }

  // Build the update data object with only provided fields
  const updateData = {
    ...(name && { name }),
    ...(contact && { contact: contact }),
    ...(nationality && { nationality }),
    ...(dateOfBirth && { dateOfBirth }),
    ...(address && { address }),
    ...(bankDetails && { bankDetails }),
    ...(emergencyContact && { emergencyContact }),
  };

  // Check if no fields are provided to update
  if (Object.keys(updateData).length === 0) {
    return res.status(400).send("No valid fields provided for update.");
  }

  try {
    await prisma.candidate.update({
      where: { cuid },
      data: updateData,
    });

    return res.send(`Candidate ${cuid} updated successfully.`);
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === "P2025") {
      return res.status(404).send("Candidate not found.");
    }

    console.log(error);
    return res.status(500).send("Internal server error.");
  }
});

export default candidateAPIRoutes;
