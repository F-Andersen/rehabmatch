import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("GET /api/v1/health", () => {
  it("returns ok status envelope", async () => {
    const app = createApp();
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok" } });
  });
});
