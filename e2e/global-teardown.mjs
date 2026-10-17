import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

export default async function globalTeardown() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  loadEnv({ path: path.join(root, ".env") });
  loadEnv({ path: path.join(root, ".env.e2e"), override: true });

  if (!process.env.E2E_DATABASE_URL) {
    return;
  }

  execSync("npx tsx scripts/e2e-db-cleanup.ts", {
    cwd: path.join(root, "server"),
    stdio: "inherit",
    env: process.env,
  });
}
