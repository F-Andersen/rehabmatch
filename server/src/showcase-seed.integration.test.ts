import { describe, expect, it } from "vitest";
import { getDatabaseNameFromUrl } from "./lib/e2e-database-guard.js";
import { SHOWCASE_DATABASE_NAME } from "./lib/showcase-database-guard.js";

const databaseUrl = process.env.DATABASE_URL ?? "";

const isShowcaseDb =
  databaseUrl.length > 0 && getDatabaseNameFromUrl(databaseUrl) === SHOWCASE_DATABASE_NAME;

describe.skipIf(!isShowcaseDb)("Showcase seed integrity", () => {
  it("documents that showcase tests run only on rehabmatch_showcase", () => {
    expect(SHOWCASE_DATABASE_NAME).toBe("rehabmatch_showcase");
  });
});
