import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/http-errors.js";

type Bucket = { count: number; resetAt: number };

const defaultBuckets = new Map<string, Bucket>();

export function rateLimit(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  store?: Map<string, Bucket>;
}) {
  const buckets = options.store ?? defaultBuckets;
  return (req: Request, _res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `${options.keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (bucket.count >= options.max) {
      next(new AppError(429, "RATE_LIMITED", "Забагато запитів. Спробуйте пізніше."));
      return;
    }

    bucket.count += 1;
    next();
  };
}
