import { Prisma, SpecialistStatus, UserRole } from "@prisma/client";
import { normalizeEmail } from "../../lib/email.js";
import { AppError } from "../../lib/http-errors.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { prisma } from "../../lib/prisma.js";
import { createSessionToken, hashSessionToken } from "../../lib/session-token.js";
import type { SessionUser } from "../../types/express.js";
import type { LoginInput, RegisterInput, UpdateMeInput } from "./auth.schemas.js";
import { env } from "../../lib/env.js";

const userInclude = {
  patient: true,
  specialist: true,
} satisfies Prisma.UserInclude;

const INVALID_CREDENTIALS_MESSAGE = "Невірна електронна пошта або пароль";

export async function registerUser(input: RegisterInput): Promise<{ user: SessionUser; token: string }> {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Користувач із такою поштою вже існує");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        passwordHash,
        role: input.role,
      },
      include: userInclude,
    });

    if (input.role === UserRole.PATIENT) {
      await tx.patient.create({ data: { userId: created.id } });
    }

    if (input.role === UserRole.SPECIALIST) {
      await tx.specialist.create({
        data: {
          userId: created.id,
          pricePerSession: new Prisma.Decimal(0),
          verificationStatus: SpecialistStatus.PENDING,
          description: "",
          isDemo: false,
        },
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: created.id },
      include: userInclude,
    });
  });

  const token = await createSessionForUser(user.id);
  const freshUser = await loadUserById(user.id);
  return { user: freshUser, token };
}

export async function loginUser(input: LoginInput): Promise<{ user: SessionUser; token: string }> {
  const email = normalizeEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email },
    include: userInclude,
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  const token = await createSessionForUser(user.id);
  const freshUser = await loadUserById(user.id);
  return { user: freshUser, token };
}

export async function logoutSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function loadUserById(userId: string): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Користувача не знайдено");
  }
  return user;
}

export async function resolveSessionFromToken(token: string): Promise<{
  user: SessionUser;
  sessionId: string;
} | null> {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { include: userInclude },
    },
  });

  if (!session || !session.user.isActive) {
    return null;
  }

  return { user: session.user, sessionId: session.id };
}

export async function updateCurrentUser(userId: string, input: UpdateMeInput): Promise<SessionUser> {
  const data: Prisma.UserUpdateInput = {};
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.phone !== undefined) data.phone = input.phone;

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  return loadUserById(userId);
}

async function createSessionForUser(userId: string): Promise<string> {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return token;
}
