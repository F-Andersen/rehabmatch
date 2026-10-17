import { SpecialistStatus } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { mapPublicSpecialist } from "./specialist.mapper.js";
import { specialistPublicInclude } from "./specialist.includes.js";
import type { z } from "zod";
import type { adminSpecialistsQuerySchema } from "./specialist.schemas.js";

type AdminListQuery = z.infer<typeof adminSpecialistsQuerySchema>;

export async function listSpecialistsForAdmin(query: AdminListQuery) {
  const where = query.status ? { verificationStatus: query.status } : {};
  const skip = (query.page - 1) * query.pageSize;

  const [total, items] = await Promise.all([
    prisma.specialist.count({ where }),
    prisma.specialist.findMany({
      where,
      include: specialistPublicInclude,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    data: items.map((item) => ({
      ...mapPublicSpecialist(item),
      userId: item.userId,
      updatedAt: item.updatedAt,
    })),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function updateSpecialistVerification(
  specialistId: string,
  status: SpecialistStatus,
) {
  const specialist = await prisma.specialist.findUnique({ where: { id: specialistId } });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Спеціаліста не знайдено");
  }

  if (status === SpecialistStatus.APPROVED && !specialist.cityId) {
    throw new AppError(
      422,
      "PROFILE_INCOMPLETE",
      "Неможливо підтвердити профіль без заповненого міста",
    );
  }

  const updated = await prisma.specialist.update({
    where: { id: specialistId },
    data: {
      verificationStatus: status,
      verifiedAt: status === SpecialistStatus.APPROVED ? new Date() : null,
      isVisible: status !== SpecialistStatus.REJECTED,
    },
    include: specialistPublicInclude,
  });

  return mapPublicSpecialist(updated);
}
