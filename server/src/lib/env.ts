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

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  apiPort: readPort("API_PORT", 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};
