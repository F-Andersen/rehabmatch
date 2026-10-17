import { describe, expect, it } from "vitest";
import { assertSafeE2eDatabase, getDatabaseNameFromUrl } from "./e2e-database-guard.js";

describe("e2e-database-guard", () => {
  it("parses database name from DATABASE_URL", () => {
    expect(
      getDatabaseNameFromUrl("postgresql://u:p@localhost:5432/rehabmatch_e2e?schema=public"),
    ).toBe("rehabmatch_e2e");
  });

  it("allows rehabmatch_e2e", () => {
    expect(() =>
      assertSafeE2eDatabase("postgresql://u:p@localhost:5432/rehabmatch_e2e?schema=public"),
    ).not.toThrow();
  });

  it("refuses primary demo database rehabmatch", () => {
    expect(() =>
      assertSafeE2eDatabase("postgresql://u:p@localhost:5432/rehabmatch?schema=public"),
    ).toThrow(/refusing/i);
  });

  it("refuses unknown database names", () => {
    expect(() =>
      assertSafeE2eDatabase("postgresql://u:p@localhost:5432/production?schema=public"),
    ).toThrow(/allowed/i);
  });
});
