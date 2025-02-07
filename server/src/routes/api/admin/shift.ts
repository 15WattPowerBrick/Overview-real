import dayjs from "dayjs";
import { Router } from "express";
import { User } from "@/types/common";
import { PrismaError } from "@/types";
import { prisma } from "../../../client";
import {
  PERMISSION_ERROR_TEMPLATE,
  checkPermission,
  PermissionList,
} from "../../../utils/permissions";

const projectShiftAPIRouter: Router = Router();

/**
DELETE /api/admin/shift/:shiftCuid

Deletes a shift identified by its cuid.

Parameters:
shiftCuid

Steps:
1. Check permissions, either:
  a. User is a client holder of the project
  b. User has CAN_EDIT_ALL_PROJECTS permission
2. Check connected attendances:
  a. If there are future attendances, prevent deletion
  b. If there are no attendances, hard delete
  c. If there are past attendances, soft delete
*/
projectShiftAPIRouter.delete("/shift/:shiftCuid", async (req, res) => {
  const user = req.user as User;
  const { shiftCuid } = req.params;

  if (!shiftCuid)
    return res.status(400).json({
      message: "Please specify a shift cuid.",
    });

  let shiftData;
  try {
    shiftData = await prisma.shift.findUniqueOrThrow({
      where: {
        cuid: shiftCuid,
      },
      include: {
        Project: {
          include: {
            Manage: {
              where: {
                role: "CLIENT_HOLDER",
              },
            },
          },
        },
        Attendance: true,
      },
    });
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === "P2025") {
      return res.status(404).send("Shift does not exist.");
    }

    console.log(error);
    return res.status(500).send("Internal server error.");
  }

  const hasPermission =
    shiftData.Project.Manage.some(
      (manage) => manage.consultantCuid === user.cuid
    ) ||
    (await checkPermission(user.cuid, PermissionList.CAN_EDIT_ALL_PROJECTS));

  if (!hasPermission) {
    return res
      .status(401)
      .send(PERMISSION_ERROR_TEMPLATE + PermissionList.CAN_EDIT_ALL_PROJECTS);
  }

  // Prevent/soft/hard delete based on attendance
  // scheduled future attendances => prevent delete
  // past attendances => soft delete
  // no attendances => hard delete

  if (shiftData.Attendance.length === 0) {
    await prisma.shift.delete({
      where: {
        cuid: shiftCuid,
      },
    });

    return res.json({ message: "Shift deleted successfully." });
  }

  // include attendences which end after current time
  const shiftEndTime = dayjs(shiftData.endTime);
  const futureAttendances = shiftData.Attendance.filter((attendance) => {
    const endTime = dayjs(attendance.shiftDate)
      .hour(shiftEndTime.hour())
      .minute(shiftEndTime.minute())
      .second(shiftEndTime.second())
      .millisecond(shiftEndTime.millisecond());

    return endTime.isAfter(dayjs());
  });

  if (futureAttendances.length > 0) {
    return res.status(400).json({ message: "Cannot delete ongoing shifts." });
  }

  await prisma.shift.update({
    where: {
      cuid: shiftCuid,
    },
    data: {
      status: "ARCHIVED",
    },
  });

  return res.json({ message: "Shift deleted successfully." });
});

export default projectShiftAPIRouter;
