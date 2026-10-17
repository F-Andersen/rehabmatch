import { Router } from "express";
import { parsePagination } from "../../lib/pagination.js";
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

specialistsRouter.get("/specialists/:id/reviews", async (req, res, next) => {
  try {
    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
    const result = await listApprovedReviews(req.params.id, page, pageSize);
    res.json(result);
  } catch (error) {
    next(error);
  }
});
