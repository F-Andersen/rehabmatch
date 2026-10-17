/** Allowed PostgreSQL database names for destructive E2E scripts (must not match demo `rehabmatch`). */
export const E2E_ALLOWED_DATABASE_NAMES = new Set(["rehabmatch_e2e"]);

export function getDatabaseNameFromUrl(databaseUrl: string): string {
  try {
    const parsed = new URL(databaseUrl);
    const segment = parsed.pathname.replace(/^\//, "").split("/")[0];
    if (!segment) {
      throw new Error("missing database segment");
    }
    return decodeURIComponent(segment);
  } catch {
    throw new Error(`Invalid DATABASE_URL (cannot parse database name): ${databaseUrl}`);
  }
}

/**
 * Refuses demo/production DB names. Call before migrate reset, truncate, or mass delete in E2E tooling.
 */
export function assertSafeE2eDatabase(databaseUrl: string): void {
  const name = getDatabaseNameFromUrl(databaseUrl);

  if (name === "rehabmatch") {
    throw new Error(
      'Refusing E2E maintenance on primary database "rehabmatch". Use E2E_DATABASE_URL → rehabmatch_e2e.',
    );
  }

  if (!E2E_ALLOWED_DATABASE_NAMES.has(name)) {
    throw new Error(
      `Refusing E2E maintenance on database "${name}". Allowed: ${[...E2E_ALLOWED_DATABASE_NAMES].join(", ")}.`,
    );
  }
}
