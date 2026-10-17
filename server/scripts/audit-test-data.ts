import { prisma } from "../src/lib/prisma.js";

const patterns = ["e2e-", "m6-", "m2auth-", "m3cat-", "m5rec-", "demo-DEMO-", "@example.test"];

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: patterns.map((p) => ({ email: { contains: p, mode: "insensitive" } })),
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      patient: { select: { id: true } },
      specialist: { select: { id: true, verificationStatus: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  console.log(JSON.stringify({ count: users.length, users }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
