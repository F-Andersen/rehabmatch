import type { SessionUser } from "../types/express.js";

export type PublicUserDto = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  patientId: string | null;
  specialistId: string | null;
  specialistVerificationStatus: string | null;
};

export function toPublicUserDto(user: SessionUser): PublicUserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    patientId: user.patient?.id ?? null,
    specialistId: user.specialist?.id ?? null,
    specialistVerificationStatus: user.specialist?.verificationStatus ?? null,
  };
}
