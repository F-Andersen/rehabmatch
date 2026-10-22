import { Router } from "express";
import { UserRole } from "@prisma/client";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  replaceServicesSchema,
  updateSpecialistProfileSchema,
} from "../../modules/specialists/specialist.schemas.js";
import {
  listAppointmentsQuerySchema,
  specialistStatusSchema,
} from "../../modules/appointments/appointment.schemas.js";
import {
  listSpecialistAppointmentRequests,
  updateSpecialistAppointmentStatus,
} from "../../modules/appointments/appointment.service.js";
import {
  getOwnSpecialistProfile,
  replaceOwnServices,
  updateOwnSpecialistProfile,
} from "../../modules/specialists/specialist.profile.service.js";
import { saveSpecialistPhotoFromBase64 } from "../../lib/specialist-photo-upload.js";
import { z } from "zod";

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

const uploadPhotoSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataBase64: z.string().min(32).max(3_000_000),
});

specialistPortalRouter.post("/me/photo", async (req, res, next) => {
  try {
    const input = uploadPhotoSchema.parse(req.body);
    const profile = await getOwnSpecialistProfile(req.user!.id);
    const photoUrl = await saveSpecialistPhotoFromBase64(
      profile.id,
      input.mimeType,
      input.dataBase64,
    );
    const data = await updateOwnSpecialistProfile(req.user!.id, { photoUrl });
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

specialistPortalRouter.get("/appointment-requests", async (req, res, next) => {
  try {
    const query = listAppointmentsQuerySchema.parse(req.query);
    const result = await listSpecialistAppointmentRequests(req.user!.id, query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

specialistPortalRouter.patch("/appointment-requests/:id/status", async (req, res, next) => {
  try {
    const input = specialistStatusSchema.parse(req.body);
    const data = await updateSpecialistAppointmentStatus(req.user!.id, req.params.id, input);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
