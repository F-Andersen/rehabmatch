import { AppointmentRequestStatus, SpecialistStatus } from "@prisma/client";
import { sanitizePlainText } from "../../lib/sanitize.js";
import { AppError } from "../../lib/http-errors.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import {
  assertPatientCancelTransition,
  assertSpecialistStatusTransition,
} from "./appointment.state.js";
import type {
  createAppointmentRequestSchema,
  listAppointmentsQuerySchema,
  specialistStatusSchema,
} from "./appointment.schemas.js";
import type { z } from "zod";

type CreateInput = z.infer<typeof createAppointmentRequestSchema>;
type ListQuery = z.infer<typeof listAppointmentsQuerySchema>;
type SpecialistStatusInput = z.infer<typeof specialistStatusSchema>;

function mapRequest(row: {
  id: string;
  status: AppointmentRequestStatus;
  preferredAt: Date;
  note: string | null;
  createdAt: Date;
  patient?: { user: { fullName: string } };
  specialist?: { user: { fullName: string } };
}) {
  return {
    id: row.id,
    status: row.status,
    preferredAt: row.preferredAt,
    note: row.note,
    createdAt: row.createdAt,
    patientName: row.patient?.user.fullName,
    specialistName: row.specialist?.user.fullName,
  };
}

export async function createAppointmentRequest(patientId: string, input: CreateInput) {
  const preferredAt = new Date(input.preferredAt);
  if (Number.isNaN(preferredAt.getTime())) {
    throw new AppError(400, "VALIDATION_ERROR", "Некоректна дата");
  }
  if (preferredAt.getTime() < Date.now() - 60_000) {
    throw new AppError(422, "VALIDATION_ERROR", "Не можна обрати дату в минулому");
  }

  const specialist = await prisma.specialist.findFirst({
    where: {
      id: input.specialistId,
      verificationStatus: SpecialistStatus.APPROVED,
      isVisible: true,
    },
  });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Спеціаліст недоступний для заявки");
  }

  const note = input.note ? sanitizePlainText(input.note) : null;

  const created = await prisma.appointmentRequest.create({
    data: {
      patientId,
      specialistId: input.specialistId,
      preferredAt,
      note: note || null,
      status: AppointmentRequestStatus.REQUESTED,
    },
    include: {
      specialist: { include: { user: { select: { fullName: true } } } },
    },
  });

  return mapRequest(created);
}

export async function listPatientAppointmentRequests(patientId: string, query: ListQuery) {
  const where = {
    patientId,
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.appointmentRequest.count({ where }),
    prisma.appointmentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: {
        specialist: { include: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    data: items.map(mapRequest),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function listSpecialistAppointmentRequests(specialistUserId: string, query: ListQuery) {
  const specialist = await prisma.specialist.findUnique({ where: { userId: specialistUserId } });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Профіль спеціаліста не знайдено");
  }

  const where = {
    specialistId: specialist.id,
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.appointmentRequest.count({ where }),
    prisma.appointmentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: {
        patient: { include: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    data: items.map(mapRequest),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function listAdminAppointmentRequests(query: ListQuery) {
  const where = query.status ? { status: query.status } : {};
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.appointmentRequest.count({ where }),
    prisma.appointmentRequest.findMany({
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
    data: items.map(mapRequest),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function updateSpecialistAppointmentStatus(
  specialistUserId: string,
  requestId: string,
  input: SpecialistStatusInput,
) {
  const specialist = await prisma.specialist.findUnique({ where: { userId: specialistUserId } });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Профіль спеціаліста не знайдено");
  }

  const request = await prisma.appointmentRequest.findFirst({
    where: { id: requestId, specialistId: specialist.id },
  });
  if (!request) {
    throw new AppError(404, "NOT_FOUND", "Заявку не знайдено");
  }

  assertSpecialistStatusTransition(request.status, input.status);

  const updated = await prisma.appointmentRequest.update({
    where: { id: requestId },
    data: { status: input.status },
    include: {
      patient: { include: { user: { select: { fullName: true } } } },
    },
  });

  return mapRequest(updated);
}

export async function cancelPatientAppointmentRequest(patientId: string, requestId: string) {
  const request = await prisma.appointmentRequest.findFirst({
    where: { id: requestId, patientId },
  });
  if (!request) {
    throw new AppError(404, "NOT_FOUND", "Заявку не знайдено");
  }

  assertPatientCancelTransition(request.status);

  const updated = await prisma.appointmentRequest.update({
    where: { id: requestId },
    data: { status: AppointmentRequestStatus.CANCELLED },
    include: {
      specialist: { include: { user: { select: { fullName: true } } } },
    },
  });

  return mapRequest(updated);
}
