import { ReviewStatus, SpecialistStatus, UserRole } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const origin = env.clientOrigin;
const testPrefix = `m6-${Date.now()}`;

function withOrigin(req: request.Test) {
  return req.set("Origin", origin);
}

function sessionCookieFromResponse(res: request.Response): string | undefined {
  const header = res.headers["set-cookie"];
  if (!header) return undefined;
  const first = Array.isArray(header) ? header[0] : header;
  return first?.split(";")[0];
}

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { contains: testPrefix } },
    select: { id: true, patient: { select: { id: true } } },
  });
  const userIds = users.map((u) => u.id);
  const patientIds = users.map((u) => u.patient?.id).filter(Boolean) as string[];

  if (patientIds.length > 0) {
    const searchRequests = await prisma.searchRequest.findMany({
      where: { patientId: { in: patientIds } },
      select: { id: true },
    });
    const searchRequestIds = searchRequests.map((row) => row.id);
    if (searchRequestIds.length > 0) {
      await prisma.recommendationItem.deleteMany({
        where: { recommendation: { searchRequestId: { in: searchRequestIds } } },
      });
      await prisma.recommendation.deleteMany({ where: { searchRequestId: { in: searchRequestIds } } });
      await prisma.criterionPriority.deleteMany({ where: { searchRequestId: { in: searchRequestIds } } });
      await prisma.criterionComparison.deleteMany({
        where: { searchRequestId: { in: searchRequestIds } },
      });
      await prisma.searchRequest.deleteMany({ where: { id: { in: searchRequestIds } } });
    }
    await prisma.appointmentRequest.deleteMany({ where: { patientId: { in: patientIds } } });
    await prisma.review.deleteMany({ where: { patientId: { in: patientIds } } });
  }

  const specialists = await prisma.specialist.findMany({
    where: { userId: { in: userIds } },
    select: { id: true },
  });
  const specialistIds = specialists.map((s) => s.id);
  if (specialistIds.length > 0) {
    await prisma.recommendationItem.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.review.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.appointmentRequest.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.service.deleteMany({ where: { specialistId: { in: specialistIds } } });
    await prisma.specialistSpecialization.deleteMany({ where: { specialistId: { in: specialistIds } } });
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

async function registerPatient(email: string) {
  const res = await withOrigin(
    request(app).post("/api/v1/auth/register").send({
      fullName: "M6 Patient",
      email,
      password: "M6PatientPass123!",
      role: UserRole.PATIENT,
    }),
  );
  expect(res.status).toBe(201);
  const cookie = sessionCookieFromResponse(res);
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { patient: true },
  });
  return { cookie, patientId: user!.patient!.id, userId: user!.id };
}

async function registerApprovedSpecialist(email: string) {
  const res = await withOrigin(
    request(app).post("/api/v1/auth/register").send({
      fullName: "M6 Specialist",
      email,
      password: "M6SpecPass123!",
      role: UserRole.SPECIALIST,
    }),
  );
  expect(res.status).toBe(201);
  const cookie = sessionCookieFromResponse(res);
  const city = await prisma.city.findFirst();
  const spec = await prisma.specialization.findFirst();
  const injury = await prisma.injuryType.findFirst();
  const format = await prisma.appointmentFormat.findFirst();

  await withOrigin(
    request(app)
      .put("/api/v1/specialist/me")
      .set("Cookie", cookie ?? "")
      .send({
        cityId: city!.id,
        pricePerSession: 900,
        experienceYears: 3,
        description: "M6 test specialist",
        specializationIds: [spec!.id],
        injuryTypeIds: [injury!.id],
        formatIds: [format!.id],
      }),
  );

  const specialist = await prisma.specialist.findFirst({
    where: { user: { email: email.toLowerCase() } },
  });
  await prisma.specialist.update({
    where: { id: specialist!.id },
    data: { verificationStatus: SpecialistStatus.APPROVED, isVisible: true, verifiedAt: new Date() },
  });

  return { cookie, specialistId: specialist!.id };
}

async function loginAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD required");
  }
  const res = await withOrigin(
    request(app).post("/api/v1/auth/login").send({ email, password }),
  );
  expect(res.status).toBe(200);
  return sessionCookieFromResponse(res);
}

describe("M6 reviews and appointment requests", () => {
  beforeAll(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it("REV-01 patient creates review pending moderation", async () => {
    const patientEmail = `${testPrefix}-rev-patient@example.test`;
    const specEmail = `${testPrefix}-rev-spec@example.test`;
    const { cookie: patientCookie } = await registerPatient(patientEmail);
    const { specialistId } = await registerApprovedSpecialist(specEmail);

    const create = await withOrigin(
      request(app)
        .post(`/api/v1/specialists/${specialistId}/reviews`)
        .set("Cookie", patientCookie ?? "")
        .send({ rating: 4, comment: "Дуже уважний спеціаліст" }),
    );
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe("PENDING");

    const publicList = await request(app).get(`/api/v1/specialists/${specialistId}/reviews`);
    expect(publicList.body.data.length).toBe(0);
  });

  it("REV-04 admin approves review and updates rating", async () => {
    const patientEmail = `${testPrefix}-rev-admin-p@example.test`;
    const specEmail = `${testPrefix}-rev-admin-s@example.test`;
    const { cookie: patientCookie, patientId } = await registerPatient(patientEmail);
    const { specialistId } = await registerApprovedSpecialist(specEmail);

    await withOrigin(
      request(app)
        .post(`/api/v1/specialists/${specialistId}/reviews`)
        .set("Cookie", patientCookie ?? "")
        .send({ rating: 5, comment: "Чудова консультація" }),
    );

    const review = await prisma.review.findUnique({
      where: { patientId_specialistId: { patientId, specialistId } },
    });
    const adminCookie = await loginAdmin();
    const approve = await withOrigin(
      request(app)
        .patch(`/api/v1/admin/reviews/${review!.id}/status`)
        .set("Cookie", adminCookie ?? "")
        .send({ status: ReviewStatus.APPROVED }),
    );
    expect(approve.status).toBe(200);

    const specialist = await prisma.specialist.findUnique({ where: { id: specialistId } });
    expect(specialist?.ratingCount).toBe(1);
    expect(specialist?.ratingAvg).toBe(5);

    const publicList = await request(app).get(`/api/v1/specialists/${specialistId}/reviews`);
    expect(publicList.body.data.length).toBe(1);
  });

  it("REV-05 specialist cannot moderate reviews", async () => {
    const specEmail = `${testPrefix}-rev-forbid@example.test`;
    const { cookie } = await registerApprovedSpecialist(specEmail);
    const res = await withOrigin(
      request(app)
        .get("/api/v1/admin/reviews")
        .set("Cookie", cookie ?? ""),
    );
    expect(res.status).toBe(403);
  });

  it("REV-08 invalid rating rejected", async () => {
    const patientEmail = `${testPrefix}-rev-bad@example.test`;
    const specEmail = `${testPrefix}-rev-bad-s@example.test`;
    const { cookie } = await registerPatient(patientEmail);
    const { specialistId } = await registerApprovedSpecialist(specEmail);

    const res = await withOrigin(
      request(app)
        .post(`/api/v1/specialists/${specialistId}/reviews`)
        .set("Cookie", cookie ?? "")
        .send({ rating: 6, comment: "Некоректна оцінка" }),
    );
    expect(res.status).toBe(400);
  });

  it("REQ-01 patient creates appointment request", async () => {
    const patientEmail = `${testPrefix}-req-p@example.test`;
    const specEmail = `${testPrefix}-req-s@example.test`;
    const { cookie } = await registerPatient(patientEmail);
    const { specialistId } = await registerApprovedSpecialist(specEmail);

    const preferredAt = new Date(Date.now() + 86_400_000).toISOString();
    const res = await withOrigin(
      request(app)
        .post("/api/v1/appointment-requests")
        .set("Cookie", cookie ?? "")
        .send({ specialistId, preferredAt, note: "Потрібна консультація" }),
    );
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("REQUESTED");
  });

  it("REQ-04/05 specialist status transitions and forbidden transition", async () => {
    const patientEmail = `${testPrefix}-req-st-p@example.test`;
    const specEmail = `${testPrefix}-req-st-s@example.test`;
    const { cookie: patientCookie } = await registerPatient(patientEmail);
    const { cookie: specCookie, specialistId } = await registerApprovedSpecialist(specEmail);

    const preferredAt = new Date(Date.now() + 86_400_000).toISOString();
    const created = await withOrigin(
      request(app)
        .post("/api/v1/appointment-requests")
        .set("Cookie", patientCookie ?? "")
        .send({ specialistId, preferredAt }),
    );
    const requestId = created.body.data.id;

    const accept = await withOrigin(
      request(app)
        .patch(`/api/v1/specialist/appointment-requests/${requestId}/status`)
        .set("Cookie", specCookie ?? "")
        .send({ status: "ACCEPTED" }),
    );
    expect(accept.status).toBe(200);

    const conflict = await withOrigin(
      request(app)
        .patch(`/api/v1/specialist/appointment-requests/${requestId}/status`)
        .set("Cookie", specCookie ?? "")
        .send({ status: "DECLINED" }),
    );
    expect(conflict.status).toBe(409);
  });

  it("REQ-06 patient cannot access another patient's request", async () => {
    const p1 = `${testPrefix}-req-o1@example.test`;
    const p2 = `${testPrefix}-req-o2@example.test`;
    const specEmail = `${testPrefix}-req-o-s@example.test`;
    const { cookie: c1 } = await registerPatient(p1);
    const { cookie: c2 } = await registerPatient(p2);
    const { specialistId } = await registerApprovedSpecialist(specEmail);

    const preferredAt = new Date(Date.now() + 86_400_000).toISOString();
    const created = await withOrigin(
      request(app)
        .post("/api/v1/appointment-requests")
        .set("Cookie", c1 ?? "")
        .send({ specialistId, preferredAt }),
    );

    const cancel = await withOrigin(
      request(app)
        .patch(`/api/v1/me/appointment-requests/${created.body.data.id}/cancel`)
        .set("Cookie", c2 ?? ""),
    );
    expect(cancel.status).toBe(404);
  });

  it("REQ-07 unauthenticated appointment create returns 401", async () => {
    const res = await withOrigin(
      request(app).post("/api/v1/appointment-requests").send({
        specialistId: "00000000-0000-0000-0000-000000000001",
        preferredAt: new Date().toISOString(),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("ADMIN-01 admin summary includes pending reviews", async () => {
    const adminCookie = await loginAdmin();
    const res = await withOrigin(
      request(app).get("/api/v1/admin/summary").set("Cookie", adminCookie ?? ""),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.pendingReviews).toBeGreaterThanOrEqual(0);
  });
});
