import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  replaceServicesSchema,
  updateSpecialistProfileSchema,
} from "../../modules/specialists/specialist.schemas.js";
import {
  getOwnSpecialistProfile,
  replaceOwnServices,
  updateOwnSpecialistProfile,
} from "../../modules/specialists/specialist.profile.service.js";

export const specialistPortalRouter = Router();

specialistPortalRouter.use(requireAuth, requireRole(UserRole.SPECIALIST));

specialistPortalRouter.get("/me", async (req, res, next) => {
  try {
    const data = await getOwnSpecialistProfile(req.user!.id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

specialistPortalRouter.put("/me", async (req, res, next) => {
  try {
    const input = updateSpecialistProfileSchema.parse(req.body);
    const data = await updateOwnSpecialistProfile(req.user!.id, input);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

specialistPortalRouter.put("/me/services", async (req, res, next) => {
  try {
    const input = replaceServicesSchema.parse(req.body);
    const data = await replaceOwnServices(req.user!.id, input);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
