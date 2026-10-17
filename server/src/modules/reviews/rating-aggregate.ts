import type { Prisma } from "@prisma/client";

export async function recalculateSpecialistRating(
  specialistId: string,
  tx: Prisma.TransactionClient,
): Promise<void> {
  const approved = await tx.review.findMany({
    where: { specialistId, status: "APPROVED" },
    select: { rating: true },
  });

  if (approved.length === 0) {
    await tx.specialist.update({
      where: { id: specialistId },
      data: { ratingAvg: null, ratingCount: 0 },
    });
    return;
  }

  const sum = approved.reduce((acc, row) => acc + row.rating, 0);
  const avg = sum / approved.length;

  await tx.specialist.update({
    where: { id: specialistId },
    data: {
      ratingAvg: avg,
      ratingCount: approved.length,
    },
  });
}
