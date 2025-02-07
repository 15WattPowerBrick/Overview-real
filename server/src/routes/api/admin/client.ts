import { Router, Request, Response } from "express";
import { prisma } from "../../../client";
import { PrismaError } from "@/types";
import { User } from "@/types/common";
import {
  PermissionList,
  checkPermission,
  PERMISSION_ERROR_TEMPLATE,
} from "../../../utils/permissions";

const clientAPIRoutes: Router = Router();
/**
GET /api/admin/client/:uen

Retrieve the client with the given UEN.
*/
clientAPIRoutes.get("/client/:uen"),
  async (req: Request, res: Response) => {
    const { uen } = req.params;

    try {
      const clientData = await prisma.client.findUniqueOrThrow({
        where: {
          uen,
        },
      });

      return res.send(clientData);
    } catch (error) {
      return res.status(404).send("Client does not exist.");
    }
  };

/**
POST /api/admin/client

Create a new client.
*/
clientAPIRoutes.post("/client", async (req, res) => {
  const { uen, name } = req.body;

  if (!uen) return res.status(400).send("uen is required.");
  if (!name) return res.status(400).send("name is required.");

  try {
    await prisma.client.create({
      data: {
        uen,
        name,
      },
    });
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === "P2002") {
      return res.status(400).send("Client already exists.");
    }

    console.log(error);
    return res.status(500).send("Internal server error.");
  }

  return res.send("Client created successfully.");
});

// Currently unused
clientAPIRoutes.delete("/client", async (req, res) => {
  const user = req.user as User;
  const { uen } = req.body;

  if (!uen) return res.status(400).send("uen is required.");

  const hasDeleteClientPermission = checkPermission(
    user.cuid,
    PermissionList.CAN_DELETE_CLIENTS
  );

  if (!hasDeleteClientPermission) {
    return res
      .status(401)
      .send(PERMISSION_ERROR_TEMPLATE + PermissionList.CAN_DELETE_CLIENTS);
  }

  try {
    const clientToDelete = await prisma.client.findUniqueOrThrow({
      where: {
        uen,
      },
      include: {
        Project: true,
      },
    });

    if (clientToDelete.Project.length > 0) {
      return res.status(400).send("Client has linked projects.");
    }

    await prisma.client.delete({
      where: {
        uen,
      },
    });

    return res.send("Client deleted successfully.");
  } catch (error) {
    return res.status(404).send("Client does not exist.");
  }
});

async function updateClient(req: Request, res: Response) {
  const user = req.user as User;
  const { uen, name } = req.body;

  if (!uen) return res.status(400).send("uen is required.");
  if (!name) return res.status(400).send("name is required.");

  const hasUpdateClientPermission = checkPermission(
    user.cuid,
    PermissionList.CAN_UPDATE_CLIENTS
  );

  if (!hasUpdateClientPermission) {
    return res
      .status(401)
      .send(PERMISSION_ERROR_TEMPLATE + PermissionList.CAN_UPDATE_CLIENTS);
  }

  try {
    await prisma.client.update({
      where: {
        uen,
      },
      data: {
        name: name,
      },
    });

    return res.send("Client updated successfully.");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal server error.");
  }
}

// Unused
clientAPIRoutes.put("/client", updateClient);
clientAPIRoutes.patch("/client", updateClient);

/**
GET /api/admin/clients

Retrieve all clients. (Project creation autocomplete)
*/
clientAPIRoutes.get("/clients", async (_req, res) => {
  const clientsData = await prisma.client.findMany({
    select: {
      uen: true,
      name: true,
    },
  });

  return res.send(clientsData);
});

export default clientAPIRoutes;
