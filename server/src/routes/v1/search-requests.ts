import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { AppError } from "../../lib/http-errors.js";
import { createSearchRequestSchema } from "../../modules/search/search.schemas.js";
import {
  createSearchRequest,
  getSearchRequestForPatient,
} from "../../modules/search/search.service.js";

export const searchRequestsRouter = Router();

searchRequestsRouter.use(requireAuth, requireRole(UserRole.PATIENT));

searchRequestsRouter.post("/", async (req, res, next) => {
  try {
    const input = createSearchRequestSchema.parse(req.body);
    if (!req.user?.patient) {
      throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
    }
    const patientId = req.user.patient.id;
    const data = await createSearchRequest(patientId, input);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

searchRequestsRouter.get("/:id", async (req, res, next) => {
  try {
    if (!req.user?.patient) {
      throw new AppError(404, "NOT_FOUND", "Профіль пацієнта не знайдено");
    }
    const patientId = req.user.patient.id;
    const data = await getSearchRequestForPatient(patientId, req.params.id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
