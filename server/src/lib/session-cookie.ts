import type { CookieOptions, Response } from "express";
import { env } from "./env.js";

export function getSessionCookieOptions(): CookieOptions {
  const maxAgeMs = env.sessionTtlHours * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    maxAge: maxAgeMs,
    path: "/",
  };
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(env.sessionCookieName, token, getSessionCookieOptions());
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(env.sessionCookieName, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
  });
}
