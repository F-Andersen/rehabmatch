import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

export default async function globalSetup() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  loadEnv({ path: path.join(root, ".env") });
  loadEnv({ path: path.join(root, ".env.e2e"), override: true });

  if (!process.env.E2E_DATABASE_URL) {
    throw new Error(
      "Missing E2E_DATABASE_URL. Copy .env.e2e.example → .env.e2e and create database rehabmatch_e2e.",
    );
  }

  execSync("npx tsx scripts/e2e-db-prepare.ts", {
    cwd: path.join(root, "server"),
    stdio: "inherit",
    env: process.env,
  });
}
