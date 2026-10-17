import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { parsePagination } from "../../lib/pagination.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { createReviewSchema } from "../../modules/reviews/review.schemas.js";
import {
  getOwnReviewForSpecialist,
  upsertReviewForSpecialist,
} from "../../modules/reviews/review.service.js";
import {
  getPublicSpecialistById,
  listApprovedReviews,
  listPublicSpecialists,
} from "../../modules/specialists/specialist.catalog.service.js";
import { specialistsListQuerySchema } from "../../modules/specialists/specialist.schemas.js";

export const specialistsRouter = Router();

specialistsRouter.get("/specialists", async (req, res, next) => {
  try {
    const query = specialistsListQuerySchema.parse(req.query);
    const result = await listPublicSpecialists(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

specialistsRouter.get("/specialists/:id", async (req, res, next) => {
  try {
    const data = await getPublicSpecialistById(req.params.id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

specialistsRouter.get(
  "/specialists/:id/reviews/mine",
  requireAuth,
  requireRole(UserRole.PATIENT),
  async (req, res, next) => {
    try {
      if (!req.user?.patient) {
        throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
      }
      const specialistId = String(req.params.id);
      const data = await getOwnReviewForSpecialist(req.user.patient.id, specialistId);
      res.json({ data });
    } catch (error) {
      next(error);
    }
  },
);

specialistsRouter.get("/specialists/:id/reviews", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
    const result = await listApprovedReviews(req.params.id, page, pageSize);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

specialistsRouter.post(
  "/specialists/:id/reviews",
  requireAuth,
  requireRole(UserRole.PATIENT),
  async (req, res, next) => {
    try {
      if (!req.user?.patient) {
        throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
      }
      const input = createReviewSchema.parse(req.body);
      const specialistId = String(req.params.id);
      const data = await upsertReviewForSpecialist(req.user.patient.id, specialistId, input);
      res.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  },
);
