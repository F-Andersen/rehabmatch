import { SpecialistStatus, UserRole } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const origin = env.clientOrigin;
const testPrefix = `m3cat-${Date.now()}`;

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

  const specialists = await prisma.specialist.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const specialistIds = specialists.map((s) => s.id);

  if (specialistIds.length > 0) {
    await prisma.service.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.specialistSpecialization.deleteMany({
      where: { specialistId: { in: specialistIds } },
    });
    await prisma.specialistInjuryType.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.specialistAppointmentFormat.deleteMany({
      where: { specialistId: { in: specialistIds } },
    });
  }

  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.specialist.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.patient.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

async function registerSpecialist(email: string) {
  const res = await withOrigin(
    request(app).post("/api/v1/auth/register").send({
      fullName: "M3 Specialist",
      email,
      password: "M3SpecPass123!",
      role: UserRole.SPECIALIST,
    }),
  );
  expect(res.status).toBe(201);
  const cookie = sessionCookieFromResponse(res);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const specialist = user
    ? await prisma.specialist.findUnique({ where: { userId: user.id } })
    : null;
  return { cookie, specialist, user };
}

describe("Catalog & specialists M3", () => {
  beforeAll(async () => {
    await cleanupTestUsers();
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("CAT-01 catalog dictionaries are public", async () => {
    const res = await request(app).get("/api/v1/catalog");
    expect(res.status).toBe(200);
    expect(res.body.data.cities.length).toBeGreaterThan(0);
    expect(res.body.data.specializations.length).toBeGreaterThan(0);
  });

  it("CAT-02 lists only APPROVED specialists with city", async () => {
    const res = await request(app).get("/api/v1/specialists?pageSize=5");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.total).toBeGreaterThan(0);
    for (const item of res.body.data) {
      expect(item.fullName).toBeTruthy();
      expect(item.city).toBeTruthy();
      expect(item.email).toBeUndefined();
    }
  });

  it("CAT-03 pending specialist not in public list or by id", async () => {
    const email = `${testPrefix}-pending@example.test`;
    const { specialist } = await registerSpecialist(email);
    expect(specialist?.cityId).toBeNull();

    const list = await request(app).get("/api/v1/specialists?q=M3+Specialist");
    const found = list.body.data?.some((row: { id: string }) => row.id === specialist?.id);
    expect(found).toBe(false);

    const detail = await request(app).get(`/api/v1/specialists/${specialist!.id}`);
    expect(detail.status).toBe(404);
  });

  it("CAT-04 specialist registration has no default city", async () => {
    const email = `${testPrefix}-nocity@example.test`;
    const { specialist } = await registerSpecialist(email);
    expect(specialist?.cityId).toBeNull();
  });

  it("CAT-05 specialist can update own profile; patient cannot", async () => {
    const specEmail = `${testPrefix}-owner@example.test`;
    const { cookie, specialist } = await registerSpecialist(specEmail);
    const city = await prisma.city.findFirst();
    const spec = await prisma.specialization.findFirst();
    const injury = await prisma.injuryType.findFirst();
    const format = await prisma.appointmentFormat.findFirst();
    expect(city && spec && injury && format).toBeTruthy();

    const badUpdate = await withOrigin(
      request(app)
        .put("/api/v1/specialist/me")
        .set("Cookie", cookie ?? "")
        .send({ pricePerSession: -10 }),
    );
    expect(badUpdate.status).toBe(400);

    const update = await withOrigin(
      request(app)
        .put("/api/v1/specialist/me")
        .set("Cookie", cookie ?? "")
        .send({
          cityId: city!.id,
          pricePerSession: 1200,
          experienceYears: 5,
          description: "Test profile",
          specializationIds: [spec!.id],
          injuryTypeIds: [injury!.id],
          formatIds: [format!.id],
        }),
    );
    expect(update.status).toBe(200);
    expect(update.body.data.verificationStatus).toBe("PENDING");

    const patientEmail = `${testPrefix}-patient@example.test`;
    const patientReg = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "M3 Patient",
        email: patientEmail,
        password: "M3PatientPass1!",
        role: UserRole.PATIENT,
      }),
    );
    const patientCookie = sessionCookieFromResponse(patientReg);

    const forbidden = await withOrigin(
      request(app)
        .put("/api/v1/specialist/me")
        .set("Cookie", patientCookie ?? "")
        .send({ description: "hack" }),
    );
    expect(forbidden.status).toBe(403);

    await prisma.specialist.update({
      where: { id: specialist!.id },
      data: { verificationStatus: SpecialistStatus.APPROVED, isVisible: true },
    });

    const material = await withOrigin(
      request(app)
        .put("/api/v1/specialist/me")
        .set("Cookie", cookie ?? "")
        .send({ pricePerSession: 1500 }),
    );
    expect(material.status).toBe(200);
    expect(material.body.data.verificationStatus).toBe("PENDING");
  });

  it("CAT-06 admin approves specialist and appears in catalog", async () => {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password || password.includes("REPLACE_WITH")) {
      return;
    }

    const specEmail = `${testPrefix}-approve@example.test`;
    const { cookie: specCookie } = await registerSpecialist(specEmail);
    const city = await prisma.city.findFirst();
    const spec = await prisma.specialization.findFirst();
    const injury = await prisma.injuryType.findFirst();
    const format = await prisma.appointmentFormat.findFirst();

    await withOrigin(
      request(app)
        .put("/api/v1/specialist/me")
        .set("Cookie", specCookie ?? "")
        .send({
          cityId: city!.id,
          pricePerSession: 900,
          experienceYears: 3,
          description: "Ready for approval",
          specializationIds: [spec!.id],
          injuryTypeIds: [injury!.id],
          formatIds: [format!.id],
        }),
    );

    const specialist = await prisma.specialist.findFirst({
      where: { user: { email: specEmail.toLowerCase() } },
    });
    expect(specialist).toBeTruthy();

    const adminLogin = await withOrigin(
      request(app).post("/api/v1/auth/login").send({ email, password }),
    );
    const adminCookie = sessionCookieFromResponse(adminLogin);

    const approve = await withOrigin(
      request(app)
        .patch(`/api/v1/admin/specialists/${specialist!.id}/verification`)
        .set("Cookie", adminCookie ?? "")
        .send({ status: "APPROVED" }),
    );
    expect(approve.status).toBe(200);

    const publicDetail = await request(app).get(`/api/v1/specialists/${specialist!.id}`);
    expect(publicDetail.status).toBe(200);

    const patientReg = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "M3 Patient Admin",
        email: `${testPrefix}-nopadmin@example.test`,
        password: "M3PatientPass2!",
        role: UserRole.PATIENT,
      }),
    );
    const patientCookie = sessionCookieFromResponse(patientReg);
    const patientTry = await withOrigin(
      request(app)
        .patch(`/api/v1/admin/specialists/${specialist!.id}/verification`)
        .set("Cookie", patientCookie ?? "")
        .send({ status: "REJECTED" }),
    );
    expect(patientTry.status).toBe(403);
  });

  it("CAT-07 filters and pagination", async () => {
    const approved = await prisma.specialist.findFirst({
      where: {
        verificationStatus: SpecialistStatus.APPROVED,
        isVisible: true,
        cityId: { not: null },
      },
      include: { city: true },
    });
    expect(approved?.cityId).toBeTruthy();

    const byCity = await request(app).get(
      `/api/v1/specialists?cityId=${approved!.cityId}&pageSize=3&page=1`,
    );
    expect(byCity.status).toBe(200);
    expect(byCity.body.data.length).toBeLessThanOrEqual(3);
    for (const row of byCity.body.data) {
      expect(row.city?.id).toBe(approved!.cityId);
    }

    const empty = await request(app).get("/api/v1/specialists?q=zzzznonexistent99999");
    expect(empty.status).toBe(200);
    expect(empty.body.data).toEqual([]);
  });
});
