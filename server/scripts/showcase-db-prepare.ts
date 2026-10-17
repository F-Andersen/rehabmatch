import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { assertSafeShowcaseDatabase, SHOWCASE_DATABASE_NAME } from "../src/lib/showcase-database-guard.js";
import { getDatabaseNameFromUrl } from "../src/lib/e2e-database-guard.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");

config({ path: path.join(repoRoot, ".env.showcase") });

const showcaseUrl = process.env.SHOWCASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!showcaseUrl) {
  throw new Error("SHOWCASE_DATABASE_URL or DATABASE_URL required (.env.showcase).");
}

assertSafeShowcaseDatabase(showcaseUrl);
const dbName = getDatabaseNameFromUrl(showcaseUrl);

async function ensureDatabaseExists(): Promise<void> {
  const adminUrl = process.env.SHOWCASE_POSTGRES_ADMIN_URL;
  if (!adminUrl) {
    console.warn("SHOWCASE_POSTGRES_ADMIN_URL not set — skipping CREATE DATABASE.");
    return;
  }
  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const rows = await admin.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${dbName}) AS "exists"
    `;
    if (!rows[0]?.exists) {
      await admin.$executeRawUnsafe(`CREATE DATABASE "${dbName.replace(/"/g, "")}"`);
      console.log(`Created database ${SHOWCASE_DATABASE_NAME}`);
    }
  } finally {
    await admin.$disconnect();
  }
}

async function main(): Promise<void> {
  await ensureDatabaseExists();
  const env = { ...process.env, DATABASE_URL: showcaseUrl };
  const serverDir = path.join(repoRoot, "server");
  execSync("npx prisma migrate deploy", { cwd: serverDir, env, stdio: "inherit" });
  console.log(`Showcase database ready: ${dbName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
