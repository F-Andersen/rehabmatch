import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { createAppointmentRequestSchema } from "../../modules/appointments/appointment.schemas.js";
import { createAppointmentRequest } from "../../modules/appointments/appointment.service.js";

export const appointmentRequestsRouter = Router();

appointmentRequestsRouter.post(
  "/appointment-requests",
  requireAuth,
  requireRole(UserRole.PATIENT),
  async (req, res, next) => {
    try {
      if (!req.user?.patient) {
        throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
      }
      const input = createAppointmentRequestSchema.parse(req.body);
      const data = await createAppointmentRequest(req.user.patient.id, input);
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);
