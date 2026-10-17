import { describe, expect, it } from "vitest";
import { assertSafeShowcaseDatabase } from "./showcase-database-guard.js";

describe("showcase-database-guard", () => {
  it("allows rehabmatch_showcase", () => {
    expect(() =>
      assertSafeShowcaseDatabase("postgresql://u:p@localhost:5432/rehabmatch_showcase?schema=public"),
    ).not.toThrow();
  });

  it("refuses rehabmatch demo db", () => {
    expect(() =>
      assertSafeShowcaseDatabase("postgresql://u:p@localhost:5432/rehabmatch?schema=public"),
    ).toThrow(/refusing/i);
  });

  it("refuses e2e db", () => {
    expect(() =>
      assertSafeShowcaseDatabase("postgresql://u:p@localhost:5432/rehabmatch_e2e?schema=public"),
    ).toThrow(/refusing/i);
  });
});
