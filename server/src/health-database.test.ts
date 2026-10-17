import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock("./lib/prisma.js", () => ({
  prisma: {
    $queryRaw: queryRaw,
  },
  disconnectPrisma: vi.fn(),
}));

import { createApp } from "./app.js";

describe("GET /api/v1/health/database", () => {
  beforeEach(() => {
    queryRaw.mockReset();
  });

  it("returns connected when database responds", async () => {
    queryRaw.mockResolvedValueOnce([{ "?column?": 1 }]);
    const app = createApp();

    const response = await request(app).get("/api/v1/health/database");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok", database: "connected" } });
  });

  it("returns 503 when database is unavailable", async () => {
    queryRaw.mockRejectedValueOnce(new Error("connection refused"));
    const app = createApp();

    const response = await request(app).get("/api/v1/health/database");

    expect(response.status).toBe(503);
    expect(response.body.error?.code).toBe("DATABASE_UNAVAILABLE");
  });
});
