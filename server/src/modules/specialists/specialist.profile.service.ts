import { Prisma, SpecialistStatus } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { prisma } from "../../lib/prisma.js";
import { mapPublicSpecialist } from "./specialist.mapper.js";
import { specialistPublicInclude } from "./specialist.includes.js";
import type { replaceServicesSchema, updateSpecialistProfileSchema } from "./specialist.schemas.js";
import type { z } from "zod";

type UpdateInput = z.infer<typeof updateSpecialistProfileSchema>;
type ReplaceServicesInput = z.infer<typeof replaceServicesSchema>;

function hasMaterialChanges(
  current: {
    cityId: string | null;
    districtId: string | null;
    pricePerSession: Prisma.Decimal;
    experienceYears: number;
    description: string;
    specializationIds: string[];
    injuryTypeIds: string[];
    formatIds: string[];
    inclusiveSpace: boolean;
  },
  input: UpdateInput,
): boolean {
  if (input.cityId !== undefined && input.cityId !== current.cityId) return true;
  if (input.districtId !== undefined && input.districtId !== current.districtId) return true;
  if (input.pricePerSession !== undefined && input.pricePerSession !== Number(current.pricePerSession)) {
    return true;
  }
  if (input.experienceYears !== undefined && input.experienceYears !== current.experienceYears) return true;
  if (input.description !== undefined && input.description !== current.description) return true;
  if (input.inclusiveSpace !== undefined && input.inclusiveSpace !== current.inclusiveSpace) return true;
  if (input.specializationIds && !sameIds(input.specializationIds, current.specializationIds)) return true;
  if (input.injuryTypeIds && !sameIds(input.injuryTypeIds, current.injuryTypeIds)) return true;
  if (input.formatIds && !sameIds(input.formatIds, current.formatIds)) return true;
  return false;
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

async function validateLocation(cityId: string | null | undefined, districtId: string | null | undefined) {
  if (districtId && !cityId) {
    throw new AppError(400, "VALIDATION_ERROR", "Спочатку оберіть місто");
  }
  if (cityId) {
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    if (!city) throw new AppError(400, "VALIDATION_ERROR", "Невідоме місто");
  }
  if (districtId) {
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district) throw new AppError(400, "VALIDATION_ERROR", "Невідомий район");
    if (cityId && district.cityId !== cityId) {
      throw new AppError(400, "VALIDATION_ERROR", "Район не належить обраному місту");
    }
  }
}

export async function getOwnSpecialistProfile(userId: string) {
  const specialist = await prisma.specialist.findUnique({
    where: { userId },
    include: specialistPublicInclude,
  });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Профіль спеціаліста не знайдено");
  }
  return mapPublicSpecialist(specialist);
}

export async function updateOwnSpecialistProfile(userId: string, input: UpdateInput) {
  const specialist = await prisma.specialist.findUnique({
    where: { userId },
    include: {
      specializations: true,
      injuryTypes: true,
      appointmentFormats: true,
    },
  });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Профіль спеціаліста не знайдено");
  }

  const nextCityId = input.cityId !== undefined ? input.cityId : specialist.cityId;
  const nextDistrictId = input.districtId !== undefined ? input.districtId : specialist.districtId;
  await validateLocation(nextCityId, nextDistrictId);

  const currentSnapshot = {
    cityId: specialist.cityId,
    districtId: specialist.districtId,
    pricePerSession: specialist.pricePerSession,
    experienceYears: specialist.experienceYears,
    description: specialist.description,
    inclusiveSpace: specialist.inclusiveSpace,
    specializationIds: specialist.specializations.map((item) => item.specializationId),
    injuryTypeIds: specialist.injuryTypes.map((item) => item.injuryTypeId),
    formatIds: specialist.appointmentFormats.map((item) => item.formatId),
  };

  const shouldReverify =
    specialist.verificationStatus === SpecialistStatus.APPROVED &&
    hasMaterialChanges(currentSnapshot, input);

  await prisma.$transaction(async (tx) => {
    if (input.fullName) {
      await tx.user.update({ where: { id: userId }, data: { fullName: input.fullName } });
    }

    await tx.specialist.update({
      where: { id: specialist.id },
      data: {
        description: input.description ?? undefined,
        experienceYears: input.experienceYears ?? undefined,
        pricePerSession:
          input.pricePerSession !== undefined
            ? new Prisma.Decimal(input.pricePerSession)
            : undefined,
        cityId: input.cityId !== undefined ? input.cityId : undefined,
        districtId: input.districtId !== undefined ? input.districtId : undefined,
        inclusiveSpace: input.inclusiveSpace ?? undefined,
        photoUrl: input.photoUrl !== undefined ? input.photoUrl : undefined,
        verificationStatus: shouldReverify ? SpecialistStatus.PENDING : undefined,
        verifiedAt: shouldReverify ? null : undefined,
      },
    });

    if (input.specializationIds) {
      await tx.specialistSpecialization.deleteMany({ where: { specialistId: specialist.id } });
      await tx.specialistSpecialization.createMany({
        data: input.specializationIds.map((specializationId) => ({
          specialistId: specialist.id,
          specializationId,
        })),
      });
    }

    if (input.injuryTypeIds) {
      await tx.specialistInjuryType.deleteMany({ where: { specialistId: specialist.id } });
      await tx.specialistInjuryType.createMany({
        data: input.injuryTypeIds.map((injuryTypeId) => ({
          specialistId: specialist.id,
          injuryTypeId,
        })),
      });
    }

    if (input.formatIds) {
      await tx.specialistAppointmentFormat.deleteMany({ where: { specialistId: specialist.id } });
      await tx.specialistAppointmentFormat.createMany({
        data: input.formatIds.map((formatId) => ({
          specialistId: specialist.id,
          formatId,
        })),
      });
    }
  });

  return getOwnSpecialistProfile(userId);
}

export async function replaceOwnServices(userId: string, input: ReplaceServicesInput) {
  const specialist = await prisma.specialist.findUnique({ where: { userId } });
  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Профіль спеціаліста не знайдено");
  }

  await prisma.$transaction(async (tx) => {
    await tx.service.deleteMany({ where: { specialistId: specialist.id } });
    if (input.services.length > 0) {
      await tx.service.createMany({
        data: input.services.map((service) => ({
          specialistId: specialist.id,
          name: service.name,
          description: service.description ?? "",
          price: new Prisma.Decimal(service.price),
          isActive: true,
        })),
      });
    }
  });

  return getOwnSpecialistProfile(userId);
}
