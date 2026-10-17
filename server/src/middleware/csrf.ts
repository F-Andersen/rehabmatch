import type { NextFunction, Request, Response } from "express";
import { env } from "../lib/env.js";
import { AppError } from "../lib/http-errors.js";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function csrfOriginCheck(req: Request, _res: Response, next: NextFunction): void {
  if (!MUTATING.has(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  const referer = req.get("referer");

  if (!origin && !referer) {
    if (env.nodeEnv === "test") {
      next();
      return;
    }
    next(new AppError(403, "CSRF_ORIGIN_MISSING", "Заборонений запит"));
    return;
  }

  const allowed = env.clientOrigin;
  const originOk = origin === allowed;
  const refererOk = referer?.startsWith(`${allowed}/`) || referer === allowed;

  if (!originOk && !refererOk) {
    next(new AppError(403, "CSRF_ORIGIN_MISMATCH", "Заборонений запит"));
    return;
  }

  next();
}
