import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loadConfigFromFile } from "@prisma/config";
import { ahpCalculateBodySchema } from "./modules/ahp/ahp.schemas.js";
import { replaceServicesSchema, updateSpecialistProfileSchema } from "./modules/specialists/specialist.schemas.js";

describe("compressed request parser stays alive", () => {
  it.each(["valid", "gzip", "deflate"])("handles %s in an isolated process", async (variant) => {
    const result = await new Promise<{ code: number | null; output: string; errors: string }>((resolve, reject) => {
      const child = spawn(process.execPath, ["--import", "tsx", "src/test-fixtures/compressed-body-probe.ts", variant], { cwd: process.cwd(), env: process.env });
      let output = ""; let errors = "";
      const timer = setTimeout(() => { child.kill(); reject(new Error("Parser probe timed out")); }, 8000);
      child.stdout.on("data", (data) => { output += data; });
      child.stderr.on("data", (data) => { errors += data; });
      child.on("error", reject);
      child.on("close", (code) => { clearTimeout(timer); resolve({ code, output, errors }); });
    });
    expect(result.code, result.errors).toBe(0);
    const response = JSON.parse(result.output.trim());
    expect(response.health).toBe(200);
    expect(variant === "valid" ? [404] : [400, 404]).toContain(response.status);
  }, 10_000);
});

describe("bounded validation work", () => {
  it("rejects an oversized array before visiting children, preserving valid input", () => {
    let visited = 0;
    const schema = z.array(z.string().refine(() => { visited++; return true; })).max(20);
    expect(schema.safeParse(Array(1000).fill("x")).success).toBe(false);
    expect(visited).toBe(0);
    expect(schema.parse(["x"])).toEqual(["x"]);
    expect(visited).toBe(1);
  });
  it.each([
    { name: "AHP comparisons", schema: ahpCalculateBodySchema, input: { mode: "AHP_PAIRWISE", comparisons: Array(1000).fill({}) } },
    { name: "services", schema: replaceServicesSchema, input: { services: Array(1000).fill({}) } },
    { name: "specialization IDs", schema: updateSpecialistProfileSchema, input: { specializationIds: Array(1000).fill("invalid") } },
  ])("bounds issues for $name", ({ schema, input }) => {
    const result = schema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues).toHaveLength(1);
  });
});

describe("Prisma configuration merger compatibility", () => {
  const fromConfig = createRequire(createRequire(import.meta.url).resolve("@prisma/config"));
  const { deepmerge, deepmergeInto } = fromConfig("deepmerge-ts") as {
    deepmerge: (...values: unknown[]) => unknown;
    deepmergeInto: (target: unknown, ...sources: unknown[]) => void;
  };
  it("preserves ordinary nested configuration merging", () => {
    expect(deepmerge({ migrations: { path: "prisma/migrations" } }, { migrations: { seed: "tsx seed.ts" } }))
      .toEqual({ migrations: { path: "prisma/migrations", seed: "tsx seed.ts" } });
  });
  it("does not exhaust the stack for either recursive merge API", () => {
    const left: { self?: unknown } = {}; left.self = left;
    const right: { self?: unknown } = {}; right.self = right;
    expect(() => deepmerge(left, right)).not.toThrow(RangeError);
    expect(() => deepmergeInto(left, right)).not.toThrow(RangeError);
  });
  it("loads an actual Prisma 6 configuration through C12", async () => {
    const result = await loadConfigFromFile({ configFile: path.resolve("src/test-fixtures/prisma.config.ts"), configRoot: process.cwd() });
    expect(result.error).toBeUndefined();
    expect(result.config?.schema).toContain("schema.prisma");
    expect(result.config?.migrations?.path).toContain("migrations");
  });
});
