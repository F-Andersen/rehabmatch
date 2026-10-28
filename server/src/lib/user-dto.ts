import type { SessionUser } from "../types/express.js";

export type PublicUserDto = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  patientId: string | null;
  cityId: string | null;
  specialistId: string | null;
  specialistVerificationStatus: string | null;
};

export function toPublicUserDto(user: SessionUser): PublicUserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    patientId: user.patient?.id ?? null,
    cityId: user.patient?.cityId ?? null,
    specialistId: user.specialist?.id ?? null,
    specialistVerificationStatus: user.specialist?.verificationStatus ?? null,
  };
}
