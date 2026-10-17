import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { assertSafeE2eDatabase, getDatabaseNameFromUrl } from "../src/lib/e2e-database-guard.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");

config({ path: path.join(repoRoot, ".env") });
config({ path: path.join(repoRoot, ".env.e2e") });

const e2eUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
if (!e2eUrl) {
  throw new Error("E2E_DATABASE_URL is required (see .env.e2e.example).");
}

assertSafeE2eDatabase(e2eUrl);
const dbName = getDatabaseNameFromUrl(e2eUrl);

async function ensureDatabaseExists(): Promise<void> {
  const adminUrl = process.env.E2E_POSTGRES_ADMIN_URL;
  if (!adminUrl) {
    console.warn(
      "E2E_POSTGRES_ADMIN_URL not set — skipping CREATE DATABASE (assume rehabmatch_e2e already exists).",
    );
    return;
  }

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const rows = await admin.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${dbName}) AS "exists"
    `;
    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
      console.log(`Created database ${dbName}`);
    }
  } finally {
    await admin.$disconnect();
  }
}

async function needsSeed(): Promise<boolean> {
  const probe = new PrismaClient({ datasources: { db: { url: e2eUrl } } });
  try {
    const count = await probe.user.count();
    return count < 10;
  } finally {
    await probe.$disconnect();
  }
}

async function main(): Promise<void> {
  await ensureDatabaseExists();
  const env = { ...process.env, DATABASE_URL: e2eUrl };
  const serverDir = path.join(repoRoot, "server");
  execSync("npx prisma migrate deploy", { cwd: serverDir, env, stdio: "inherit" });
  if (await needsSeed()) {
    execSync("npx tsx prisma/seed.ts", { cwd: serverDir, env, stdio: "inherit" });
  } else {
    console.log("E2E seed skipped (database already populated).");
  }
  console.log(`E2E database ready: ${dbName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
