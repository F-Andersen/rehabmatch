import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { assertSafeE2eDatabase } from "../src/lib/e2e-database-guard.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");

config({ path: path.join(repoRoot, ".env") });
config({ path: path.join(repoRoot, ".env.e2e") });

const e2eUrl = process.env.E2E_DATABASE_URL;
if (!e2eUrl) {
  throw new Error("E2E_DATABASE_URL is required for cleanup.");
}

assertSafeE2eDatabase(e2eUrl);

const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.test").toLowerCase();

function isPreservedSeedEmail(email: string): boolean {
  const normalized = email.toLowerCase();
  if (normalized === adminEmail) return true;
  if (normalized.startsWith("demo.patient")) return true;
  if (normalized.startsWith("specialist+")) return true;
  return false;
}

const prisma = new PrismaClient({ datasources: { db: { url: e2eUrl } } });

async function cleanupEphemeralUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { contains: "@example.test" } },
    select: { id: true, email: true, patient: { select: { id: true } } },
  });

  const ephemeral = users.filter((u) => !isPreservedSeedEmail(u.email));
  const userIds = ephemeral.map((u) => u.id);
  const patientIds = ephemeral.map((u) => u.patient?.id).filter(Boolean) as string[];

  if (userIds.length === 0) {
    console.log("E2E cleanup: no ephemeral users to remove.");
    return;
  }

  if (patientIds.length > 0) {
    const searchRequests = await prisma.searchRequest.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    });
    const searchRequestIds = searchRequests.map((r) => r.id);
    if (searchRequestIds.length > 0) {
      await prisma.recommendationItem.deleteMany({
        where: { recommendation: { searchRequestId: { in: searchRequestIds } } },
      });
      await prisma.recommendation.deleteMany({ where: { searchRequestId: { in: searchRequestIds } } });
      await prisma.criterionPriority.deleteMany({ where: { searchRequestId: { in: searchRequestIds } } });
      await prisma.criterionComparison.deleteMany({
        where: { searchRequestId: { in: searchRequestIds } },
      });
      await prisma.searchRequest.deleteMany({ where: { id: { in: searchRequestIds } } });
    }
    await prisma.appointmentRequest.deleteMany({ where: { patientId: { in: patientIds } } });
    await prisma.review.deleteMany({ where: { patientId: { in: patientIds } } });
  }

  const specialists = await prisma.specialist.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const specialistIds = specialists.map((s) => s.id);
  if (specialistIds.length > 0) {
    await prisma.recommendationItem.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.review.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.appointmentRequest.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.service.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.specialistSpecialization.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.specialistInjuryType.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.specialistAppointmentFormat.deleteMany({
      where: { specialistId: { in: specialistIds } },
    });
  }

  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.specialist.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.patient.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`E2E cleanup: removed ${userIds.length} ephemeral user(s).`);
}

cleanupEphemeralUsers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
