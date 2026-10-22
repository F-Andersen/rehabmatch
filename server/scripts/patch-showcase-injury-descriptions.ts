/**
 * Idempotent copy fix for showcase injury types (no truncate / reset).
 */
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { assertSafeShowcaseDatabase } from "../src/lib/showcase-database-guard.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(repoRoot, ".env.showcase") });

const updates: Record<string, string> = {
  "Післяопераційне відновлення": "Відновлення після хірургічного втручання",
  "Спортивні травми": "Реабілітація після спортивних ушкоджень",
  "Порушення опорно-рухового апарату": "Робота з болем у спині, суглобах і поставою",
  "Неврологічна реабілітація": "Підтримка після неврологічних станів",
  "Відновлення рухливості": "Покращення ходи, балансу та самообслуговування",
};

async function main() {
  const url = process.env.DATABASE_URL ?? process.env.SHOWCASE_DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  assertSafeShowcaseDatabase(url);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  let changed = 0;
  for (const [name, description] of Object.entries(updates)) {
    const result = await prisma.injuryType.updateMany({
      where: { name },
      data: { description },
    });
    changed += result.count;
  }
  console.log(`Patched injury type descriptions: ${changed} row(s) updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
