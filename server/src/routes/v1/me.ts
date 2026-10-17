import { Router } from "express";
import { toPublicUserDto } from "../../lib/user-dto.js";
import { requireAuth } from "../../middleware/auth.js";
import { updateMeSchema } from "../../modules/auth/auth.schemas.js";
import { updateCurrentUser } from "../../modules/auth/auth.service.js";

export const meRouter = Router();

meRouter.patch("/", requireAuth, async (req, res, next) => {
  try {
    const input = updateMeSchema.parse(req.body);
    const user = await updateCurrentUser(req.user!.id, input);
    res.json({ data: toPublicUserDto(user) });
  } catch (error) {
    next(error);
  }
});
