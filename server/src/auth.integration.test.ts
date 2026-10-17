import { UserRole } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { hashSessionToken } from "./lib/session-token.js";

const app = createApp();
const origin = env.clientOrigin;
const testPrefix = `m2auth-${Date.now()}`;

function withOrigin(req: request.Test) {
  return req.set("Origin", origin);
}

function sessionCookieFromResponse(res: request.Response): string | undefined {
  const header = res.headers["set-cookie"];
  if (!header) return undefined;
  const first = Array.isArray(header) ? header[0] : header;
  return first?.split(";")[0];
}

async function cleanupTestUsers(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { contains: testPrefix } },
    select: { id: true },
  });
  const userIds = users.map((user) => user.id);
  if (userIds.length === 0) return;

  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.patient.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.specialist.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

describe("Auth integration", () => {
  beforeAll(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("AUTH-01 registers PATIENT", async () => {
    const email = `${testPrefix}-patient@example.test`;
    const res = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Тест Пацієнт",
        email,
        password: "PatientPass123!",
        role: UserRole.PATIENT,
      }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("PATIENT");
    expect(res.body.data.patientId).toBeTruthy();
    expect(res.body.data.passwordHash).toBeUndefined();
    expect(sessionCookieFromResponse(res)).toBeDefined();
  });

  it("AUTH-02 registers SPECIALIST as PENDING", async () => {
    const email = `${testPrefix}-specialist@example.test`;
    const res = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Тест Спеціаліст",
        email,
        password: "SpecialistPass123!",
        role: UserRole.SPECIALIST,
      }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("SPECIALIST");
    expect(res.body.data.specialistVerificationStatus).toBe("PENDING");
  });

  it("AUTH-03 login succeeds", async () => {
    const email = `${testPrefix}-login@example.test`;
    await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Login User",
        email,
        password: "LoginPass123!",
        role: UserRole.PATIENT,
      }),
    );

    const res = await withOrigin(
      request(app).post("/api/v1/auth/login").send({
        email,
        password: "LoginPass123!",
      }),
    );

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email.toLowerCase());
  });

  it("AUTH-04 rejects invalid password", async () => {
    const email = `${testPrefix}-badpass@example.test`;
    await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Bad Pass",
        email,
        password: "CorrectPass123!",
        role: UserRole.PATIENT,
      }),
    );

    const res = await withOrigin(
      request(app).post("/api/v1/auth/login").send({
        email,
        password: "WrongPass123!",
      }),
    );

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("AUTH-05 returns current user", async () => {
    const email = `${testPrefix}-me@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Me User",
        email,
        password: "MePass12345!",
        role: UserRole.PATIENT,
      }),
    );
    const cookie = sessionCookieFromResponse(register);

    const res = await request(app).get("/api/v1/auth/me").set("Cookie", cookie ?? "");

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email.toLowerCase());
  });

  it("AUTH-06 protected route without auth returns 401", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("AUTH-07 wrong role returns 403", async () => {
    const email = `${testPrefix}-forbidden@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Patient Only",
        email,
        password: "ForbiddenPass1!",
        role: UserRole.PATIENT,
      }),
    );
    const cookie = sessionCookieFromResponse(register);

    const res = await request(app)
      .get("/api/v1/admin/summary")
      .set("Cookie", cookie ?? "");

    expect(res.status).toBe(403);
  });

  it("AUTH-08 logout revokes session", async () => {
    const email = `${testPrefix}-logout@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Logout User",
        email,
        password: "LogoutPass123!",
        role: UserRole.PATIENT,
      }),
    );
    const cookie = sessionCookieFromResponse(register);

    const logout = await withOrigin(
      request(app).post("/api/v1/auth/logout").set("Cookie", cookie ?? ""),
    );
    expect(logout.status).toBe(204);

    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookie ?? "");
    expect(me.status).toBe(401);
  });

  it("AUTH-09 rejects expired session", async () => {
    const email = `${testPrefix}-expired@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Expired User",
        email,
        password: "ExpiredPass123!",
        role: UserRole.PATIENT,
      }),
    );
    const cookie = sessionCookieFromResponse(register);
    const token = cookie?.split("=")[1];
    expect(token).toBeTruthy();

    await prisma.session.updateMany({
      where: { tokenHash: hashSessionToken(token!) },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const res = await request(app).get("/api/v1/auth/me").set("Cookie", cookie ?? "");
    expect(res.status).toBe(401);
  });

  it("AUTH-10 rejects ADMIN registration", async () => {
    const res = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Fake Admin",
        email: `${testPrefix}-admin@example.test`,
        password: "AdminPass123!",
        role: "ADMIN",
      }),
    );

    expect(res.status).toBe(400);
  });

  it("AUTH-12 rejects duplicate email different case", async () => {
    const base = `${testPrefix}-dup@example.test`;
    await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Dup One",
        email: base,
        password: "DupPass12345!",
        role: UserRole.PATIENT,
      }),
    );

    const res = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Dup Two",
        email: base.toUpperCase(),
        password: "DupPass12345!",
        role: UserRole.PATIENT,
      }),
    );

    expect(res.status).toBe(409);
  });

  it("logs in seed admin and accesses admin summary", async () => {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password || password.includes("REPLACE_WITH")) {
      return;
    }

    const res = await withOrigin(
      request(app).post("/api/v1/auth/login").send({ email, password }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("ADMIN");

    const cookie = sessionCookieFromResponse(res);
    const summary = await request(app)
      .get("/api/v1/admin/summary")
      .set("Cookie", cookie ?? "");
    expect(summary.status).toBe(200);
    expect(summary.body.data.users).toBeGreaterThan(0);
  });

  it("AUTH-11 patient cannot access admin summary", async () => {
    const email = `${testPrefix}-isolate@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "Isolate Patient",
        email,
        password: "IsolatePass12!",
        role: UserRole.PATIENT,
      }),
    );
    const cookie = sessionCookieFromResponse(register);

    const foreign = await request(app)
      .get("/api/v1/patient/me")
      .set("Cookie", cookie ?? "");
    expect(foreign.status).toBe(200);

    const adminTry = await request(app)
      .get("/api/v1/admin/summary")
      .set("Cookie", cookie ?? "");
    expect(adminTry.status).toBe(403);
  });
});
