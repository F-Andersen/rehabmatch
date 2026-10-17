import type { Prisma } from "@prisma/client";

export type SpecialistWithRelations = Prisma.SpecialistGetPayload<{
  include: {
    user: { select: { fullName: true } };
    city: true;
    district: true;
    specializations: { include: { specialization: true } };
    injuryTypes: { include: { injuryType: true } };
    appointmentFormats: { include: { format: true } };
    services: true;
  };
}>;

export function mapPublicSpecialist(specialist: SpecialistWithRelations) {
  return {
    id: specialist.id,
    fullName: specialist.user.fullName,
    photoUrl: specialist.photoUrl,
    experienceYears: specialist.experienceYears,
    pricePerSession: Number(specialist.pricePerSession),
    description: specialist.description,
    city: specialist.city ? { id: specialist.city.id, name: specialist.city.name } : null,
    district: specialist.district
      ? { id: specialist.district.id, name: specialist.district.name }
      : null,
    specializations: specialist.specializations.map((item) => ({
      id: item.specialization.id,
      name: item.specialization.name,
    })),
    injuryTypes: specialist.injuryTypes.map((item) => ({
      id: item.injuryType.id,
      name: item.injuryType.name,
    })),
    formats: specialist.appointmentFormats.map((item) => ({
      id: item.format.id,
      name: item.format.name,
    })),
    services: specialist.services
      .filter((service) => service.isActive)
      .map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: Number(service.price),
      })),
    ratingAvg: specialist.ratingAvg,
    ratingCount: specialist.ratingCount,
    inclusiveSpace: specialist.inclusiveSpace,
    isDemo: specialist.isDemo,
    verificationStatus: specialist.verificationStatus,
  };
}

export function mapPublicSpecialistCard(specialist: SpecialistWithRelations) {
  const base = mapPublicSpecialist(specialist);
  return {
    id: base.id,
    fullName: base.fullName,
    photoUrl: base.photoUrl,
    experienceYears: base.experienceYears,
    pricePerSession: base.pricePerSession,
    city: base.city,
    district: base.district,
    specializations: base.specializations,
    formats: base.formats,
    ratingAvg: base.ratingAvg,
    ratingCount: base.ratingCount,
    inclusiveSpace: base.inclusiveSpace,
    isDemo: base.isDemo,
  };
}
