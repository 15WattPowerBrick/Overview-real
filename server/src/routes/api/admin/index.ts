import { Router } from "express";

import { User } from "@/types/common";
import { PrismaError } from "@/types";
import { prisma } from "../../../client";

import shiftAPIRoutes from "./shift";
import clientAPIRoutes from "./client";
import projectAPIRoutes from "./project";
import requestAPIRoutes from "./request";
import candidateAPIRoutes from "./candidate";
import consultantAPIRoutes from "./consultant";
import attendanceAPIRoutes from "./attendance";

const adminAPIRouter: Router = Router();

adminAPIRouter.use("/", shiftAPIRoutes);
adminAPIRouter.use("/", clientAPIRoutes);
adminAPIRouter.use("/", projectAPIRoutes);
adminAPIRouter.use("/", requestAPIRoutes);
adminAPIRouter.use("/", candidateAPIRoutes);
adminAPIRouter.use("/", consultantAPIRoutes);
adminAPIRouter.use("/", attendanceAPIRoutes);

/**
GET /api/admin

Retrieves the data of the current consultant.
Used in UserContext.
*/
adminAPIRouter.get("/", async (req, res) => {
  const { cuid } = req.user as User;

  try {
    const adminData = await prisma.consultant.findUniqueOrThrow({
      where: {
        cuid,
      },
    });

    return res.json({ ...req.user, ...adminData });
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === "P2025") {
      return res.status(404).send("Consultant does not exist.");
    }

    return res.status(500).send("Internal server error");
  }
});

export default adminAPIRouter;
