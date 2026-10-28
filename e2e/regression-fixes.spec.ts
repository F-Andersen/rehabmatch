import { randomBytes } from "node:crypto";
import { unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { expect, test } from "@playwright/test";
import { apiBase, clientOrigin, registerPatient, registerSpecialist, uniqueEmail } from "./helpers";

test("WSM selection and draft survive reload and missing browser storage", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-wsm-mode"));
  await page.goto("/matching/new");
  await page.locator("select").first().selectOption({ index: 1 });
  await page.getByRole("radio", { name: "Швидке налаштування (WSM)" }).check();
  await page.getByRole("button", { name: "Далі: критерії" }).click();
  await expect(page.getByRole("slider")).toHaveCount(5);
  await page.getByRole("slider").first().fill("8");
  await page.reload();
  await expect(page.getByRole("slider").first()).toHaveValue("8");
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await expect(page.getByRole("slider")).toHaveCount(5);
  await page.getByRole("button", { name: "Отримати рекомендації" }).click();
  await expect(page).toHaveURL(/\/recommendations\/[a-f0-9-]+$/i);
  await expect(page.getByText(/Режим: WSM/)).toBeVisible();
});

test("switching an AHP request to WSM creates a valid recommendation", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-mode-switch"));
  await page.goto("/matching/new");
  await page.locator("select").first().selectOption({ index: 1 });
  await page.getByRole("button", { name: "Далі: критерії" }).click();
  await expect(page.getByRole("button", { name: "Отримати рекомендації" })).toBeDisabled();
  await page.getByRole("button", { name: "Швидке налаштування (WSM)" }).click();
  await page.getByRole("button", { name: "Отримати рекомендації" }).click();
  await expect(page).toHaveURL(/\/recommendations\/[a-f0-9-]+$/i);
  await expect(page.getByText(/Режим: WSM/)).toBeVisible();
});

test("phone is validated in UI and API and normalized after save", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-phone"));
  await page.goto("/profile");
  await page.getByRole("textbox", { name: "Телефон" }).fill("not-a-phone");
  await page.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("від 10 до 15 цифр");
  const invalid = await page.request.patch(`${apiBase()}/me`, { data: { phone: "invalid" }, headers: { Origin: clientOrigin() } });
  expect(invalid.status()).toBe(400);
  await page.getByRole("textbox", { name: "Телефон" }).fill("+380 (50) 123-45-67");
  await page.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(page.getByText("Профіль оновлено.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Телефон" })).toHaveValue("+380501234567");
});

test("photo larger than 100 KiB is saved and publicly served; corrupt photo is rejected", async ({ page }) => {
  await registerSpecialist(page, uniqueEmail("e2e-photo"));
  const image = await sharp(randomBytes(512 * 512 * 3), { raw: { width: 512, height: 512, channels: 3 } }).png().toBuffer();
  expect(image.length).toBeGreaterThan(100 * 1024);
  const response = await page.request.post(`${apiBase()}/specialist/me/photo`, {
    data: { mimeType: "image/png", dataBase64: image.toString("base64") }, headers: { Origin: clientOrigin() },
  });
  expect(response.status(), await response.text()).toBe(200);
  const photoUrl = (await response.json()).data.photoUrl as string;
  try {
    const served = await page.request.get(photoUrl);
    expect(served.status()).toBe(200);
    expect(served.headers()["content-type"]).toContain("image/webp");
    const corrupt = await page.request.post(`${apiBase()}/specialist/me/photo`, {
      data: { mimeType: "image/png", dataBase64: Buffer.from("invalid photo contents with enough characters").toString("base64") }, headers: { Origin: clientOrigin() },
    });
    expect(corrupt.status()).toBe(400);
  } finally {
    await unlink(path.resolve("client/public", `.${photoUrl}`));
  }
});

test("home distinguishes a failed catalog request from an empty catalog and can retry", async ({ page }) => {
  await page.route("**/api/v1/specialists?**", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "Unavailable" } }) }));
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("Не вдалося завантажити спеціалістів", { timeout: 20_000 });
  await expect(page.getByText("Поки немає опублікованих спеціалістів у каталозі.")).toHaveCount(0);
  await page.unroute("**/api/v1/specialists?**");
  await page.getByRole("button", { name: "Повторити завантаження" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
