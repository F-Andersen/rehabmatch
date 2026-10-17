import { AppointmentRequestStatus } from "@prisma/client";
import { z } from "zod";

export const createAppointmentRequestSchema = z.object({
  specialistId: z.string().uuid(),
  preferredAt: z.string().datetime(),
  note: z.string().trim().max(500).optional(),
});

export const specialistStatusSchema = z.object({
  status: z.enum([AppointmentRequestStatus.ACCEPTED, AppointmentRequestStatus.DECLINED]),
});

export const listAppointmentsQuerySchema = z.object({
  status: z.nativeEnum(AppointmentRequestStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
