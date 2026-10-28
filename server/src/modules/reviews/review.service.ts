import { ReviewStatus, SpecialistStatus } from "@prisma/client";
import { sanitizePlainText } from "../../lib/sanitize.js";
import { AppError } from "../../lib/http-errors.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { recalculateSpecialistRating } from "./rating-aggregate.js";
import type { adminReviewsQuerySchema, createReviewSchema } from "./review.schemas.js";
import type { z } from "zod";

type CreateInput = z.infer<typeof createReviewSchema>;
type AdminQuery = z.infer<typeof adminReviewsQuerySchema>;

export async function upsertReviewForSpecialist(
  patientId: string,
  specialistId: string,
  input: CreateInput,
) {
  const specialist = await prisma.specialist.findFirst({
    where: {
      id: specialistId,
      verificationStatus: SpecialistStatus.APPROVED,
      isVisible: true,
    },
  });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Спеціаліста не знайдено");
  }

  const comment = sanitizePlainText(input.comment);
  if (comment.length < 3) {
    throw new AppError(400, "VALIDATION_ERROR", "Коментар занадто короткий");
  }

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.upsert({
      where: {
        patientId_specialistId: { patientId, specialistId },
      },
      create: {
        patientId,
        specialistId,
        rating: input.rating,
        comment,
        status: ReviewStatus.PENDING,
      },
      update: {
        rating: input.rating,
        comment,
        status: ReviewStatus.PENDING,
      },
    });
    // An edited review is no longer public until it is approved again.
    await recalculateSpecialistRating(specialistId, tx);
    return updated;
  });

  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    message: "Відгук надіслано на модерацію",
  };
}

export async function getOwnReviewForSpecialist(patientId: string, specialistId: string) {
  const review = await prisma.review.findUnique({
    where: { patientId_specialistId: { patientId, specialistId } },
  });
  return review
    ? {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
      }
    : null;
}

export async function listReviewsForPatient(patientId: string, page: number, pageSize: number) {
  const skip = (page - 1) * pageSize;
  const where = { patientId };
  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        specialist: { include: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    data: items.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment,
      status: item.status,
      createdAt: item.createdAt,
      specialistId: item.specialistId,
      specialistName: item.specialist.user.fullName,
    })),
    meta: buildPaginationMeta(page, pageSize, total),
  };
}

export async function listReviewsForAdmin(query: AdminQuery) {
  const where = query.status ? { status: query.status } : {};
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: {
        patient: { include: { user: { select: { fullName: true } } } },
        specialist: { include: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    data: items.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment,
      status: item.status,
      createdAt: item.createdAt,
      patientName: item.patient.user.fullName,
      specialistName: item.specialist.user.fullName,
      specialistId: item.specialistId,
    })),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function updateReviewStatusAdmin(reviewId: string, status: ReviewStatus) {
  if (status !== ReviewStatus.APPROVED && status !== ReviewStatus.REJECTED) {
    throw new AppError(400, "VALIDATION_ERROR", "Недопустимий статус");
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new AppError(404, "NOT_FOUND", "Відгук не знайдено");
    }

    const updated = await tx.review.update({
      where: { id: reviewId },
      data: { status },
    });

    await recalculateSpecialistRating(review.specialistId, tx);

    return {
      id: updated.id,
      status: updated.status,
      specialistId: updated.specialistId,
    };
  });
}
