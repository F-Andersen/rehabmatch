import { getDatabaseNameFromUrl } from "./e2e-database-guard.js";

export const SHOWCASE_DATABASE_NAME = "rehabmatch_showcase";

const FORBIDDEN_DATABASE_NAMES = new Set(["rehabmatch", "rehabmatch_e2e"]);

export function assertSafeShowcaseDatabase(databaseUrl: string): void {
  const name = getDatabaseNameFromUrl(databaseUrl);

  if (FORBIDDEN_DATABASE_NAMES.has(name)) {
    throw new Error(
      `Refusing showcase seed on "${name}". Use DATABASE_URL → ${SHOWCASE_DATABASE_NAME} only.`,
    );
  }

  if (name !== SHOWCASE_DATABASE_NAME) {
    throw new Error(
      `Refusing showcase operations on database "${name}". Allowed: ${SHOWCASE_DATABASE_NAME}.`,
    );
  }
}
