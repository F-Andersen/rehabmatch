import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { assertSafeShowcaseDatabase } from "../src/lib/showcase-database-guard.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(repoRoot, ".env.showcase") });

const url = process.env.SHOWCASE_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("Missing showcase DATABASE_URL");
assertSafeShowcaseDatabase(url);

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  const specialists = await prisma.specialist.findMany({ include: { user: true } });
  const demoNames = specialists.filter((s) => /демо|тестовий|приклад|placeholder|lorem/i.test(s.user.fullName));
  if (demoNames.length > 0) {
    throw new Error(`Found ${demoNames.length} test-like specialist names`);
  }

  const withoutPhoto = specialists.filter((s) => !s.photoUrl);
  if (withoutPhoto.length > 0) {
    throw new Error(`${withoutPhoto.length} specialists missing photoUrl`);
  }

  for (const s of specialists) {
    if (!s.photoUrl?.startsWith("/images/specialists/")) continue;
    const file = path.join(repoRoot, "client/public", s.photoUrl);
    if (!existsSync(file)) {
      throw new Error(`Missing image file ${file}`);
    }
  }

  const counts = {
    specialists: specialists.length,
    services: await prisma.service.count(),
    reviews: await prisma.review.count(),
    appointments: await prisma.appointmentRequest.count(),
    recommendations: await prisma.recommendation.count(),
  };

  if (counts.specialists < 48) throw new Error("Expected 48 specialists");
  if (counts.services < 100) throw new Error(`Expected >=100 services, got ${counts.services}`);
  if (counts.reviews < 100) throw new Error(`Expected >=100 reviews, got ${counts.reviews}`);

  console.log("Showcase verification OK:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
