import { UserRole } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { lexicographicPairs, CRITERION_KEYS } from "./algorithms/index.js";

const app = createApp();
const origin = env.clientOrigin;
const testPrefix = `m4ahp-${Date.now()}`;

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
  await prisma.specialist.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.patient.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

function allOnesComparisons() {
  return lexicographicPairs(CRITERION_KEYS).map(([criterionA, criterionB]) => ({
    criterionA,
    criterionB,
    value: 1,
  }));
}

describe("AHP calculate API", () => {
  let patientCookie: string;

  beforeAll(async () => {
    await cleanupTestUsers();
    const email = `${testPrefix}-patient@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "M4 Patient",
        email,
        password: "M4PatientPass1!",
        role: UserRole.PATIENT,
      }),
    );
    patientCookie = sessionCookieFromResponse(register) ?? "";
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  it("returns 401 without auth", async () => {
    const res = await withOrigin(
      request(app).post("/api/v1/ahp/calculate").send({
        mode: "AHP_PAIRWISE",
        comparisons: allOnesComparisons(),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("calculates AHP_PAIRWISE preview", async () => {
    const res = await withOrigin(
      request(app)
        .post("/api/v1/ahp/calculate")
        .set("Cookie", patientCookie)
        .send({
          mode: "AHP_PAIRWISE",
          comparisons: allOnesComparisons(),
        }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.algorithmVersion).toBe("ahp-gm-wsm-fixed-v1");
    expect(res.body.data.isConsistent).toBe(true);
    expect(res.body.data.weights.EXPERIENCE).toBeCloseTo(0.2, 6);
  });

  it("returns DIRECT_WSM weights with null CR", async () => {
    const res = await withOrigin(
      request(app)
        .post("/api/v1/ahp/calculate")
        .set("Cookie", patientCookie)
        .send({
          mode: "DIRECT_WSM",
          priorities: {
            EXPERIENCE: 9,
            PRICE: 1,
            RATING: 1,
            LOCATION: 1,
            FORMAT: 1,
          },
        }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.mode).toBe("DIRECT_WSM");
    expect(res.body.data.cr).toBeNull();
    expect(res.body.data.weights.EXPERIENCE).toBeCloseTo(9 / 13, 8);
  });

  it("returns inconsistent preview with weights when CR > 0.10", async () => {
    const res = await withOrigin(
      request(app)
        .post("/api/v1/ahp/calculate")
        .set("Cookie", patientCookie)
        .send({
          mode: "AHP_PAIRWISE",
          comparisons: [
            { criterionA: "EXPERIENCE", criterionB: "PRICE", value: 9 },
            { criterionA: "EXPERIENCE", criterionB: "RATING", value: 9 },
            { criterionA: "EXPERIENCE", criterionB: "LOCATION", value: 9 },
            { criterionA: "EXPERIENCE", criterionB: "FORMAT", value: 9 },
            { criterionA: "PRICE", criterionB: "RATING", value: 9 },
            { criterionA: "PRICE", criterionB: "LOCATION", value: 9 },
            { criterionA: "PRICE", criterionB: "FORMAT", value: 9 },
            { criterionA: "RATING", criterionB: "LOCATION", value: 9 },
            { criterionA: "RATING", criterionB: "FORMAT", value: 9 },
            { criterionA: "LOCATION", criterionB: "FORMAT", value: 1 / 9 },
          ],
        }),
    );
    expect(res.status).toBe(200);
    expect(res.body.data.isConsistent).toBe(false);
    expect(res.body.data.cr).toBeGreaterThan(0.1);
    expect(res.body.data.weights.EXPERIENCE).toBeGreaterThan(0);
  });

  it("rejects specialist role", async () => {
    const email = `${testPrefix}-spec@example.test`;
    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "M4 Spec",
        email,
        password: "M4SpecPass123!",
        role: UserRole.SPECIALIST,
      }),
    );
    const cookie = sessionCookieFromResponse(register);
    const res = await withOrigin(
      request(app)
        .post("/api/v1/ahp/calculate")
        .set("Cookie", cookie ?? "")
        .send({
          mode: "AHP_PAIRWISE",
          comparisons: allOnesComparisons(),
        }),
    );
    expect(res.status).toBe(403);
  });
});
