import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(UserRole.ADMIN));

adminRouter.get("/summary", async (_req, res, next) => {
  try {
    const [users, specialists, pendingSpecialists] = await Promise.all([
      prisma.user.count(),
      prisma.specialist.count(),
      prisma.specialist.count({ where: { verificationStatus: "PENDING" } }),
    ]);

    res.json({
      data: {
        users,
        specialists,
        pendingSpecialists,
      },
    });
  } catch (error) {
    next(error);
  }
});
