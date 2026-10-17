import type { Prisma } from "@prisma/client";

export const specialistPublicInclude = {
  user: { select: { fullName: true } },
  city: true,
  district: true,
  specializations: { include: { specialization: true } },
  injuryTypes: { include: { injuryType: true } },
  appointmentFormats: { include: { format: true } },
  services: { where: { isActive: true } },
} satisfies Prisma.SpecialistInclude;
