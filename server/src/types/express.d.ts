import type { User, Patient, Specialist } from "@prisma/client";

export type SessionUser = User & {
  patient: Patient | null;
  specialist: Specialist | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      sessionId?: string;
    }
  }
}

export {};
