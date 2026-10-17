import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
    path.resolve(moduleDir, "../../../.env"),
    path.resolve(moduleDir, "../../../../.env"),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      config({ path: envPath });
      return;
    }
  }
}

loadEnvFiles();

function readPort(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return parsed;
}

function readHours(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return parsed;
}

const nodeEnv = process.env.NODE_ENV ?? "development";

/** True only when explicitly opted in and never in production (keeps prod rate limits strict). */
const e2eMode =
  process.env.REHABMATCH_E2E === "1" && nodeEnv !== "production";

export const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  /** Playwright / isolated API process: higher auth quota, separate DB via E2E_DATABASE_URL. */
  e2eMode,
  apiPort: readPort("API_PORT", 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-insecure-session-secret",
  sessionTtlHours: readHours("SESSION_TTL_HOURS", 168),
  sessionCookieName: "rehabmatch_session",
  authRateLimitWindowMs: 15 * 60 * 1000,
  authRateLimitMax: e2eMode ? 10_000 : 30,
};
