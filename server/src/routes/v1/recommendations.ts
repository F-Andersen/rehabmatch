import { Router } from "express";
import { UserRole } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  createRecommendationSchema,
  listRecommendationsQuerySchema,
} from "../../modules/recommendations/recommendation.schemas.js";
import {
  createRecommendation,
  getRecommendationForPatient,
  listRecommendationsForPatient,
} from "../../modules/recommendations/recommendation.service.js";

export const recommendationsRouter = Router();

recommendationsRouter.use(requireAuth, requireRole(UserRole.PATIENT));

recommendationsRouter.post("/", async (req, res, next) => {
  try {
    const input = createRecommendationSchema.parse(req.body);
    if (!req.user?.patient) {
      throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
    }
    const patientId = req.user.patient.id;
    const data = await createRecommendation(patientId, input);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

recommendationsRouter.get("/", async (req, res, next) => {
  try {
    const query = listRecommendationsQuerySchema.parse(req.query);
    if (!req.user?.patient) {
      throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
    }
    const patientId = req.user.patient.id;
    const result = await listRecommendationsForPatient(patientId, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

recommendationsRouter.get("/:id", async (req, res, next) => {
  try {
    if (!req.user?.patient) {
      throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
    }
    const patientId = req.user.patient.id;
    const data = await getRecommendationForPatient(patientId, req.params.id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
