import { describe, expect, it } from "vitest";
import { assertSafeBenchmarkDatabase } from "./benchmark-database-guard.js";

describe("benchmark database isolation", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])("allows the dedicated database on %s", (host) => {
    expect(() => assertSafeBenchmarkDatabase(`postgresql://u:p@${host}:5432/rehabmatch_benchmark?schema=public`)).not.toThrow();
  });
  it.each([
    "postgresql://u:p@localhost/rehabmatch", "postgresql://u:p@localhost/rehabmatch_showcase",
    "postgresql://u:p@localhost/rehabmatch_e2e", "postgresql://u:p@188.137.232.136/rehabmatch_benchmark",
    "postgresql://u:p@localhost/rehabmatch_benchmark?schema=private",
    "postgresql://u:p@localhost/rehabmatch_benchmark?host=188.137.232.136",
    "postgresql://u:p@localhost/rehabmatch_benchmark?schema=public&schema=private",
    "postgresql://u:p@localhost/rehabmatch_benchmark/extra", "https://localhost/rehabmatch_benchmark", "invalid",
  ])("refuses unsafe target %s", (value) => {
    expect(() => assertSafeBenchmarkDatabase(value)).toThrow();
  });
});
