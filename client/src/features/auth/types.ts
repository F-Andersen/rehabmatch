export type UserRole = "PATIENT" | "SPECIALIST" | "ADMIN";

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  patientId: string | null;
  specialistId: string | null;
  specialistVerificationStatus: string | null;
};

export type AuthResponse = {
  data: PublicUser;
};
