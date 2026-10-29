/** Add missing request associations to known fictional profiles; never reseed users. */
import { PrismaClient } from "@prisma/client";
import { assertSafeShowcaseDatabase } from "../src/lib/showcase-database-guard.js";
import { loadShowcaseProfiles, showcaseInjuryTypes } from "../prisma/showcase/profiles.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
assertSafeShowcaseDatabase(url);
const prisma = new PrismaClient({ datasources: { db: { url } } });

async function main() {
  let added = 0;
  await prisma.$transaction(async (tx) => {
    for (const row of loadShowcaseProfiles()) {
      const extra = showcaseInjuryTypes(row).filter((name) => name !== row.injuryType);
      if (!extra.length) continue;
      const specialist = await tx.specialist.findFirst({ where: {
        user: { email: `specialist.${row.showcaseId.toLowerCase()}@example.test` },
        photoUrl: row.photoPath,
        specializations: { some: { specialization: { name: row.specialization } } },
      } });
      if (!specialist) continue;
      for (const name of extra) {
        const injury = await tx.injuryType.findUniqueOrThrow({ where: { name } });
        const result = await tx.specialistInjuryType.createMany({
          data: [{ specialistId: specialist.id, injuryTypeId: injury.id }],
          skipDuplicates: true,
        });
        added += result.count;
      }
    }
  });
  console.log(`Added showcase request associations: ${added}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
