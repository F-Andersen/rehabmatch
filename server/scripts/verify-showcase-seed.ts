import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";
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
  const manifest: { portraits: Array<{ slug: string; file: string; source: string; fullName: string; sha256: string }> } =
    JSON.parse(readFileSync(path.join(repoRoot, "fixtures/showcase/portrait-manifest.json"), "utf8"));
  if (manifest.portraits.length !== 48) throw new Error("Expected 48 portrait manifest entries");
  const hashes = new Set<string>();
  const slugs = new Set<string>();
  for (const portrait of manifest.portraits) {
    if (portrait.source !== "builtin-imagegen" || !/^sc-0(?:0[1-9]|[1-3][0-9]|4[0-8])$/.test(portrait.slug)) {
      throw new Error(`Invalid portrait provenance: ${portrait.slug}`);
    }
    if (slugs.has(portrait.slug)) throw new Error(`Duplicate portrait slug: ${portrait.slug}`);
    slugs.add(portrait.slug);
    if (portrait.file !== `/images/specialists/${portrait.slug}.webp`) throw new Error(`Invalid portrait path: ${portrait.slug}`);
    const bytes = readFileSync(path.join(repoRoot, "client/public", portrait.file));
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hash !== portrait.sha256 || hashes.has(hash)) throw new Error(`Changed or duplicate portrait: ${portrait.slug}`);
    hashes.add(hash);
    const metadata = await sharp(bytes).metadata();
    if (metadata.format !== "webp" || metadata.width !== 512 || metadata.height !== 512) {
      throw new Error(`Unexpected portrait format: ${portrait.slug}`);
    }
  }
  const specialists = await prisma.specialist.findMany({ include: { user: true } });
  for (const portrait of manifest.portraits) {
    const profile = specialists.find((specialist) => specialist.photoUrl === portrait.file);
    if (!profile || profile.user.fullName !== portrait.fullName) throw new Error(`Portrait/profile mismatch: ${portrait.slug}`);
  }
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
