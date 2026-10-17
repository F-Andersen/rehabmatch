import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { ahpCalculateBodySchema } from "../../modules/ahp/ahp.schemas.js";
import { calculateAhpPreview } from "../../modules/ahp/ahp.service.js";

export const ahpRouter = Router();

ahpRouter.post("/calculate", requireAuth, requireRole(UserRole.PATIENT), async (req, res, next) => {
  try {
    const input = ahpCalculateBodySchema.parse(req.body);
    const data = calculateAhpPreview(input);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
