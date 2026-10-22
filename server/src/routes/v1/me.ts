import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { toPublicUserDto } from "../../lib/user-dto.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { updateMeSchema } from "../../modules/auth/auth.schemas.js";
import { updateCurrentUser } from "../../modules/auth/auth.service.js";
import { listAppointmentsQuerySchema } from "../../modules/appointments/appointment.schemas.js";
import {
  cancelPatientAppointmentRequest,
  listPatientAppointmentRequests,
} from "../../modules/appointments/appointment.service.js";
import { listReviewsForPatient } from "../../modules/reviews/review.service.js";
import { z } from "zod";

export const meRouter = Router();

const patientReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

meRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const input = updateMeSchema.parse(req.body);
    const user = await updateCurrentUser(req.user!.id, input);
    res.json({ data: toPublicUserDto(user) });
  } catch (error) {
    next(error);
  }
});

meRouter.get(
  "/reviews",
  requireAuth,
  requireRole(UserRole.PATIENT),
  async (req, res, next) => {
    try {
      if (!req.user?.patient) {
        throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
      }
      const query = patientReviewsQuerySchema.parse(req.query);
      const result = await listReviewsForPatient(req.user.patient.id, query.page, query.pageSize);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

meRouter.get(
  "/appointment-requests",
  requireAuth,
  requireRole(UserRole.PATIENT),
  async (req, res, next) => {
    try {
      if (!req.user?.patient) {
        throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
      }
      const query = listAppointmentsQuerySchema.parse(req.query);
      const result = await listPatientAppointmentRequests(req.user.patient.id, query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

meRouter.patch(
  "/appointment-requests/:id/cancel",
  requireAuth,
  requireRole(UserRole.PATIENT),
  async (req, res, next) => {
    try {
      if (!req.user?.patient) {
        throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
      }
      const data = await cancelPatientAppointmentRequest(req.user.patient.id, String(req.params.id));
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);
