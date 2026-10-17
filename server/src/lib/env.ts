import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, "../../../.env") });

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
