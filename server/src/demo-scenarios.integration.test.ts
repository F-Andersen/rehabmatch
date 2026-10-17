import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PreferenceMode, UserRole } from "@prisma/client";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const origin = env.clientOrigin;
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const scenarios = JSON.parse(
  readFileSync(join(repoRoot, "fixtures/demo-scenarios.json"), "utf-8"),
) as Array<{
  id: string;
  label: string;
  city: string;
  injuryType: string;
  maxBudgetUah: number;
  comparisons: Array<{ criterionA: string; criterionB: string; value: number }>;
}>;

function withOrigin(req: request.Test) {
  return req.set("Origin", origin);
}

function sessionCookie(res: request.Response) {
  const header = res.headers["set-cookie"];
  const first = Array.isArray(header) ? header[0] : header;
  return first?.split(";")[0];
}

describe("Demo scenarios (seed DB)", () => {
  it.each(scenarios.map((s) => [s.id, s]))(
    "scenario %s produces top-5 from PostgreSQL",
    async (_id, scenario) => {
      const injury = await prisma.injuryType.findFirst({
        where: { name: scenario.injuryType },
      });
      const city = await prisma.city.findFirst({ where: { name: scenario.city } });
      expect(injury && city).toBeTruthy();

      const email = `demo-${scenario.id}-${Date.now()}@example.test`;
      const register = await withOrigin(
        request(app).post("/api/v1/auth/register").send({
          fullName: `Demo ${scenario.id}`,
          email,
          password: "DemoPass12345!",
          role: UserRole.PATIENT,
        }),
      );
      const cookie = sessionCookie(register);

      const search = await withOrigin(
        request(app)
          .post("/api/v1/search-requests")
          .set("Cookie", cookie ?? "")
          .send({
            injuryTypeId: injury!.id,
            cityId: city!.id,
            maxBudget: scenario.maxBudgetUah,
            preferenceMode: PreferenceMode.AHP_PAIRWISE,
          }),
      );
      expect(search.status).toBe(201);

      const rec = await withOrigin(
        request(app)
          .post("/api/v1/recommendations")
          .set("Cookie", cookie ?? "")
          .send({
            searchRequestId: search.body.data.id,
            mode: PreferenceMode.AHP_PAIRWISE,
            comparisons: scenario.comparisons,
            limit: 5,
          }),
      );
      expect(rec.status).toBe(201);

      const top = rec.body.data.items.slice(0, 5);
      console.log(`\n[${scenario.id}] ${scenario.label}`);
      for (const item of top) {
        console.log(
          `  #${item.rankPosition} ${item.fullName} score=${item.matchScore.toFixed(4)} (${item.matchScorePercent}%)`,
        );
      }
      expect(top.length).toBeGreaterThan(0);

      const user = await prisma.user.findUnique({
        where: { email },
        include: { patient: true },
      });
      if (user?.patient) {
        const searches = await prisma.searchRequest.findMany({ where: { patientId: user.patient.id } });
        const ids = searches.map((s) => s.id);
        await prisma.recommendation.deleteMany({ where: { searchRequestId: { in: ids } } });
        await prisma.searchRequest.deleteMany({ where: { id: { in: ids } } });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.patient.delete({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    },
    60_000,
  );
});
