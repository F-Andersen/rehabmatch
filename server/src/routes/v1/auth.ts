import { Router } from "express";
import { clearSessionCookie, setSessionCookie } from "../../lib/session-cookie.js";
import { toPublicUserDto } from "../../lib/user-dto.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { requireAuth } from "../../middleware/auth.js";
import { loginSchema, registerSchema } from "../../modules/auth/auth.schemas.js";
import { env } from "../../lib/env.js";
import { loadUserById, loginUser, logoutSession, registerUser } from "../../modules/auth/auth.service.js";

export const authRouter = Router();

const authRateLimit = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  keyPrefix: env.e2eMode ? "auth:e2e" : env.showcaseDevMode ? "auth:showcase" : "auth",
});

authRouter.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const { user, token } = await registerUser(input);
    setSessionCookie(res, token);
    res.status(201).json({ data: toPublicUserDto(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const { user, token } = await loginUser(input);
    setSessionCookie(res, token);
    res.json({ data: toPublicUserDto(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", requireAuth, async (req, res, next) => {
  try {
    if (req.sessionId) {
      await logoutSession(req.sessionId);
    }
    clearSessionCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await loadUserById(req.user!.id);
    res.json({ data: toPublicUserDto(user) });
  } catch (error) {
    next(error);
  }
});
