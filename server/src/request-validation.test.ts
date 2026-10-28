import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { updateMeSchema } from "./modules/auth/auth.schemas.js";
import { saveSpecialistPhotoFromBase64 } from "./lib/specialist-photo-upload.js";

describe("profile phone validation", () => {
  it.each(["not-a-phone", "123", "+380501234567oops", "++380501234567", "1234567890123456"])("rejects %s", (phone) => {
    expect(updateMeSchema.safeParse({ phone }).success).toBe(false);
  });
  it("normalizes a formatted phone and supports clearing it", () => {
    expect(updateMeSchema.parse({ phone: "+380 (50) 123-45-67" }).phone).toBe("+380501234567");
    expect(updateMeSchema.parse({ phone: " " }).phone).toBeNull();
    expect(updateMeSchema.parse({ phone: null }).phone).toBeNull();
    expect(updateMeSchema.parse({}).phone).toBeUndefined();
  });
});

describe("photo request boundary", () => {
  const app = createApp();
  it("allows upload JSON above 100 KiB to reach authentication", async () => {
    const response = await request(app).post("/api/v1/specialist/me/photo")
      .set("Origin", env.clientOrigin).send({ mimeType: "image/png", dataBase64: "a".repeat(200_000) });
    expect(response.status).toBe(401);
  });
  it("keeps the smaller body limit for other routes", async () => {
    const response = await request(app).post("/api/v1/auth/login")
      .set("Origin", env.clientOrigin).send({ email: "a".repeat(200_000) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
  it("rejects oversized uploads with a structured 413", async () => {
    const response = await request(app).post("/api/v1/specialist/me/photo")
      .set("Origin", env.clientOrigin).send({ dataBase64: "a".repeat(3 * 1024 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });
  it("reports corrupt image contents as a validation error", async () => {
    await expect(saveSpecialistPhotoFromBase64("12345678-1234-4234-8234-123456789012", "image/png", Buffer.from("invalid image").toString("base64")))
      .rejects.toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
  });
});
