import { Router } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  adminSpecialistsQuerySchema,
  adminVerificationSchema,
} from "../../modules/specialists/specialist.schemas.js";
import {
  listSpecialistsForAdmin,
  updateSpecialistVerification,
} from "../../modules/specialists/specialist.admin.service.js";
import { getOwnSpecialistProfile } from "../../modules/specialists/specialist.profile.service.js";

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

adminRouter.get("/specialists", async (req, res, next) => {
  try {
    const query = adminSpecialistsQuerySchema.parse(req.query);
    const result = await listSpecialistsForAdmin(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/specialists/:id", async (req, res, next) => {
  try {
    const specialist = await prisma.specialist.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    if (!specialist) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "Спеціаліста не знайдено" } });
      return;
    }
    const data = await getOwnSpecialistProfile(specialist.userId);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/specialists/:id/verification", async (req, res, next) => {
  try {
    const input = adminVerificationSchema.parse(req.body);
    const data = await updateSpecialistVerification(req.params.id, input.status);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
