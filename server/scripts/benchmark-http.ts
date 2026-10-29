import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Prisma, PrismaClient, CriterionKey, CriterionType, UserRole, SpecialistStatus, ReviewStatus, PreferenceMode } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { assertSafeBenchmarkDatabase, BENCHMARK_DATABASE_NAME } from "../src/lib/benchmark-database-guard.js";
import { filterCandidates } from "../src/algorithms/scoring/filters.js";
import { mapSpecialistToScoring } from "../src/modules/recommendations/recommendation.mapper.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
config({ path: path.join(root, ".env.benchmark") });
if (!process.env.BENCHMARK_DATABASE_URL) throw new Error("Configure .env.benchmark first");
const target = assertSafeBenchmarkDatabase(process.env.BENCHMARK_DATABASE_URL);
const databaseUrl = target.toString();
const maintenance = new URL(databaseUrl); maintenance.pathname = "/postgres";
const admin = new PrismaClient({ datasources: { db: { url: maintenance.toString() } } });
try {
  const exists = await admin.$queryRaw<Array<{ exists: boolean }>>`SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = ${BENCHMARK_DATABASE_NAME}) AS exists`;
  if (!exists[0]?.exists) await admin.$executeRawUnsafe('CREATE DATABASE "rehabmatch_benchmark"');
} finally { await admin.$disconnect(); }

process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = "test";
process.env.CLIENT_ORIGIN = "http://localhost:5187";
process.env.SESSION_SECRET = randomBytes(48).toString("hex");
execFileSync(process.execPath, [path.join(root, "node_modules/prisma/build/index.js"), "migrate", "deploy"], {
  cwd: path.join(root, "server"), env: process.env, stdio: "inherit",
});

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
const PROFILE_COUNT = 500;
const SAMPLES = 50;
const WARMUP = 10;
const patientEmail = "patient@benchmark.example.test";
const password = randomBytes(24).toString("hex");
const keys = Object.values(CriterionKey);

async function seed() {
  const active = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(active[0]?.name, BENCHMARK_DATABASE_NAME);
  const otherUsers = await prisma.user.count({ where: { NOT: { email: { endsWith: "@benchmark.example.test" } } } });
  assert.equal(otherUsers, 0, "Refusing to clear a database containing non-benchmark users");
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const quoted = tables.map(({ tablename }) => `"${tablename.replaceAll('"', '""')}"`).join(", ");
  if (quoted) await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quoted} CASCADE`);
  const city = await prisma.city.create({ data: { name: "Тестове місто" } });
  const district = await prisma.district.create({ data: { cityId: city.id, name: "Тестовий район" } });
  const injury = await prisma.injuryType.create({ data: { name: "Тестова категорія" } });
  const specialization = await prisma.specialization.create({ data: { name: "Тестова спеціалізація" } });
  const format = await prisma.appointmentFormat.create({ data: { name: "Очно" } });
  await prisma.criterion.createMany({ data: keys.map((key) => ({ key, name: key, criterionType: key === "PRICE" ? CriterionType.COST : ["LOCATION", "FORMAT"].includes(key) ? CriterionType.MATCH : CriterionType.BENEFIT })) });
  const hash = await bcrypt.hash(password, 10);
  const patient = await prisma.patient.create({ data: { city: { connect: { id: city.id } }, user: { create: { fullName: "Тестовий пацієнт", email: patientEmail, passwordHash: hash, role: UserRole.PATIENT } } } });
  const rows = Array.from({ length: PROFILE_COUNT }, (_, index) => ({ index, userId: randomUUID(), id: randomUUID() }));
  await prisma.user.createMany({ data: rows.map(({ userId, index }) => ({ id: userId, fullName: `Тестовий фахівець ${index + 1}`, email: `specialist-${index + 1}@benchmark.example.test`, passwordHash: hash, role: UserRole.SPECIALIST })) });
  await prisma.specialist.createMany({ data: rows.map(({ id, userId, index }) => ({ id, userId, cityId: city.id, districtId: district.id, experienceYears: index % 21, pricePerSession: 300 + (index * 47) % 2701, description: "Вигаданий профіль лише для вимірювання продуктивності", isDemo: true, verificationStatus: SpecialistStatus.APPROVED, ratingAvg: 3 + index % 3, ratingCount: 1 })) });
  await prisma.specialistInjuryType.createMany({ data: rows.map(({ id }) => ({ specialistId: id, injuryTypeId: injury.id })) });
  await prisma.specialistSpecialization.createMany({ data: rows.map(({ id }) => ({ specialistId: id, specializationId: specialization.id })) });
  await prisma.specialistAppointmentFormat.createMany({ data: rows.map(({ id }) => ({ specialistId: id, formatId: format.id })) });
  await prisma.review.createMany({ data: rows.map(({ id, index }) => ({ patientId: patient.id, specialistId: id, rating: 3 + index % 3, comment: "Синтетичний тестовий відгук", status: ReviewStatus.APPROVED })) });
  const candidates = await prisma.specialist.findMany({ include: { injuryTypes: true, specializations: true, appointmentFormats: true } });
  assert.equal(filterCandidates(candidates.map(mapSpecialistToScoring), { injuryTypeId: injury.id, maxBudget: 3000 }).length, PROFILE_COUNT);
  return { injuryTypeId: injury.id, cityId: city.id, maxBudget: 3000 };
}

function stats(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  const quantile = (p: number) => sorted[Math.ceil(sorted.length * p) - 1];
  return { samples: samples.length, minMs: sorted[0], medianMs: quantile(0.5), p95Ms: quantile(0.95), p99Ms: quantile(0.99), maxMs: sorted.at(-1), meanMs: samples.reduce((a, b) => a + b, 0) / samples.length };
}

async function main() {
  const search = await seed();
  const [databaseVersion] = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
  await prisma.$disconnect();
  const { createApp } = await import("../src/app.js");
  const { disconnectPrisma } = await import("../src/lib/prisma.js");
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/v1`;
  let cookie = "";
  async function request<T>(route: string, payload?: unknown): Promise<T> {
    const response = await fetch(base + route, { method: payload === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", Origin: process.env.CLIENT_ORIGIN!, Cookie: cookie }, body: payload === undefined ? undefined : JSON.stringify(payload), signal: AbortSignal.timeout(15_000) });
    assert(response.ok, `${route} returned HTTP ${response.status}`);
    const session = response.headers.get("set-cookie");
    if (session) cookie = session.split(";")[0];
    return await response.json() as T;
  }
  try {
    await request("/auth/login", { email: patientEmail, password });
    assert(cookie.startsWith("rehabmatch_session="));
    const results: Record<string, ReturnType<typeof stats>> = {};
    const modes = ["catalog", PreferenceMode.DIRECT_WSM, PreferenceMode.AHP_PAIRWISE] as const;
    const comparisons = keys.flatMap((criterionA, index) => keys.slice(index + 1).map((criterionB) => ({ criterionA, criterionB, value: 1 })));
    for (const mode of modes) {
      const samples: number[] = [];
      for (let iteration = -WARMUP; iteration < SAMPLES; iteration++) {
        const searchRequestId = mode === "catalog" ? undefined : (await request<{ data: { id: string } }>("/search-requests", { ...search, preferenceMode: mode })).data.id;
        const start = performance.now();
        if (mode === "catalog") {
          const response = await request<{ data: unknown[]; meta: { total: number } }>("/specialists?pageSize=20&sort=rating_desc");
          assert.equal(response.meta.total, PROFILE_COUNT); assert.equal(response.data.length, 20);
        } else {
          const response = await request<{ data: { items: unknown[] } }>("/recommendations", { searchRequestId, mode, limit: 20, ...(mode === PreferenceMode.DIRECT_WSM ? { priorities: Object.fromEntries(keys.map((key) => [key, 5])) } : { comparisons }) });
          assert.equal(response.data.items.length, 20);
        }
        if (iteration >= 0) samples.push(performance.now() - start);
      }
      results[mode] = stats(samples);
    }
    const acceptance = { catalogP95Below500ms: results.catalog.p95Ms < 500, directWsmP95Below1500ms: results.DIRECT_WSM.p95Ms < 1500, ahpP95Below1500ms: results.AHP_PAIRWISE.p95Ms < 1500 };
    const report = { generatedAt: new Date().toISOString(), environment: { node: process.version, prisma: Prisma.prismaVersion.client, postgres: databaseVersion.version, platform: process.platform, cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, memoryGiB: Math.round(os.totalmem() / 1024 ** 3) }, database: BENCHMARK_DATABASE_NAME, profiles: PROFILE_COUNT, eligibleCandidates: PROFILE_COUNT, concurrency: 1, warmupPerEndpoint: WARMUP, measuredSamplesPerEndpoint: SAMPLES, methodology: "Local HTTP including session lookup, DB, ranking/persistence and JSON decoding. Search creation excluded; fresh search for every recommendation. Not a concurrency/load or public-server latency test.", results, acceptance };
    const output = path.join(root, "qa-artifacts/http-benchmark.json");
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
    console.log(`Report: ${output}`);
    if (!Object.values(acceptance).every(Boolean)) process.exitCode = 1;
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await disconnectPrisma();
  }
}

try { await main(); } finally { await prisma.$disconnect(); }
