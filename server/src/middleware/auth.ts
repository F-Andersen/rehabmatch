import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env.js";
import { AppError } from "../lib/http-errors.js";
import { resolveSessionFromToken } from "../modules/auth/auth.service.js";

export async function loadAuthSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.[env.sessionCookieName];
    if (!token || typeof token !== "string") {
      next();
      return;
    }

    const session = await resolveSessionFromToken(token);
    if (session) {
      req.user = session.user;
      req.sessionId = session.sessionId;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError(401, "UNAUTHENTICATED", "Потрібна авторизація"));
    return;
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, "UNAUTHENTICATED", "Потрібна авторизація"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "Недостатньо прав"));
      return;
    }
    next();
  };
}
