import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

export const patientRouter = Router();

patientRouter.get("/me", requireAuth, requireRole(UserRole.PATIENT), (req, res, next) => {
  try {
    if (!req.user?.patient) {
      throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
    }

    res.json({
      data: {
        patientId: req.user.patient.id,
        userId: req.user.id,
      },
    });
  } catch (error) {
    next(error);
  }
});
