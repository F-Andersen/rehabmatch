import { PreferenceMode, UserRole } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { lexicographicPairs, CRITERION_KEYS } from "./algorithms/index.js";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";
import { CONTRIBUTION_SUM_TOLERANCE } from "./algorithms/config.js";

const app = createApp();
const origin = env.clientOrigin;
const testPrefix = `m5rec-${Date.now()}`;

function withOrigin(req: request.Test) {
  return req.set("Origin", origin);
}

function sessionCookieFromResponse(res: request.Response): string | undefined {
  const header = res.headers["set-cookie"];
  if (!header) return undefined;
  const first = Array.isArray(header) ? header[0] : header;
  return first?.split(";")[0];
}

function allOnesComparisons() {
  return lexicographicPairs(CRITERION_KEYS).map(([criterionA, criterionB]) => ({
    criterionA,
    criterionB,
    value: 1,
  }));
}

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({
    where: { email: { contains: testPrefix } },
    select: { id: true, patient: { select: { id: true } } },
  });
  const patientIds = users.map((u) => u.patient?.id).filter(Boolean) as string[];
  if (patientIds.length > 0) {
    const searchIds = (
      await prisma.searchRequest.findMany({
        where: { patientId: { in: patientIds } },
        select: { id: true },
      })
    ).map((s) => s.id);
    if (searchIds.length > 0) {
      await prisma.recommendation.deleteMany({ where: { searchRequestId: { in: searchIds } } });
      await prisma.searchRequest.deleteMany({ where: { id: { in: searchIds } } });
    }
  }
  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) return;
  await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.patient.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

describe("M5 recommendations pipeline", () => {
  let cookie: string;
  let injuryTypeId: string;
  let cityId: string;

  beforeAll(async () => {
    await cleanup();
    const injury = await prisma.injuryType.findFirst();
    const city = await prisma.city.findFirst();
    expect(injury && city).toBeTruthy();
    injuryTypeId = injury!.id;
    cityId = city!.id;

    const register = await withOrigin(
      request(app).post("/api/v1/auth/register").send({
        fullName: "M5 Patient",
        email: `${testPrefix}@example.test`,
        password: "M5PatientPass1!",
        role: UserRole.PATIENT,
      }),
    );
    cookie = sessionCookieFromResponse(register) ?? "";
  });

  afterAll(async () => {
    await cleanup();
  });

  it("creates search request and recommendation with AHP", async () => {
    const search = await withOrigin(
      request(app)
        .post("/api/v1/search-requests")
        .set("Cookie", cookie)
        .send({
          injuryTypeId,
          cityId,
          maxBudget: 3000,
          preferenceMode: PreferenceMode.AHP_PAIRWISE,
          formatStrict: false,
        }),
    );
    expect(search.status).toBe(201);
    const searchRequestId = search.body.data.id;

    const rec = await withOrigin(
      request(app)
        .post("/api/v1/recommendations")
        .set("Cookie", cookie)
        .send({
          searchRequestId,
          mode: PreferenceMode.AHP_PAIRWISE,
          comparisons: allOnesComparisons(),
          limit: 5,
        }),
    );
    expect(rec.status).toBe(201);
    expect(rec.body.data.algorithmVersion).toBe("ahp-gm-wsm-fixed-v1");
    expect(rec.body.data.items.length).toBeGreaterThan(0);
    for (const item of rec.body.data.items) {
      const sum = item.factors.reduce(
        (acc: number, f: { contribution: number }) => acc + f.contribution,
        0,
      );
      expect(Math.abs(sum - item.matchScore)).toBeLessThan(CONTRIBUTION_SUM_TOLERANCE);
    }

    const dup = await withOrigin(
      request(app)
        .post("/api/v1/recommendations")
        .set("Cookie", cookie)
        .send({
          searchRequestId,
          mode: PreferenceMode.AHP_PAIRWISE,
          comparisons: allOnesComparisons(),
        }),
    );
    expect(dup.status).toBe(409);

    const getOne = await request(app)
      .get(`/api/v1/recommendations/${rec.body.data.id}`)
      .set("Cookie", cookie);
    expect(getOne.status).toBe(200);

    const list = await request(app).get("/api/v1/recommendations").set("Cookie", cookie);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it("rejects inconsistent AHP on save", async () => {
    const search = await withOrigin(
      request(app)
        .post("/api/v1/search-requests")
        .set("Cookie", cookie)
        .send({
          injuryTypeId,
          maxBudget: 3000,
          preferenceMode: PreferenceMode.AHP_PAIRWISE,
        }),
    );
    const searchRequestId = search.body.data.id;

    const res = await withOrigin(
      request(app)
        .post("/api/v1/recommendations")
        .set("Cookie", cookie)
        .send({
          searchRequestId,
          mode: PreferenceMode.AHP_PAIRWISE,
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
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("AHP_INCONSISTENT");
  });

  it("creates recommendation with DIRECT_WSM", async () => {
    const search = await withOrigin(
      request(app)
        .post("/api/v1/search-requests")
        .set("Cookie", cookie)
        .send({
          injuryTypeId,
          maxBudget: 3000,
          preferenceMode: PreferenceMode.DIRECT_WSM,
        }),
    );
    const searchRequestId = search.body.data.id;

    const rec = await withOrigin(
      request(app)
        .post("/api/v1/recommendations")
        .set("Cookie", cookie)
        .send({
          searchRequestId,
          mode: PreferenceMode.DIRECT_WSM,
          priorities: {
            EXPERIENCE: 1,
            PRICE: 1,
            RATING: 1,
            LOCATION: 1,
            FORMAT: 1,
          },
          limit: 5,
        }),
    );
    expect(rec.status).toBe(201);
    expect(rec.body.data.mode).toBe("DIRECT_WSM");
  });
});
