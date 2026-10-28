import { expect, test } from "@playwright/test";
import { apiBase, apiLogin, clientOrigin, fillMinimalSpecialistProfile, registerPatient, registerSpecialist, uniqueEmail } from "./helpers";

test("matching clears an old district and exposes named inputs and selected judgments", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-district"));
  await page.goto("/matching/new");
  await page.getByLabel("Тип травми / захворювання", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("Місто", { exact: true }).selectOption({ label: "Львів" });
  await page.getByLabel("Район", { exact: true }).selectOption({ label: "Центральний" });
  await page.getByLabel("Місто", { exact: true }).selectOption({ label: "Київ" });
  await expect(page.getByLabel("Район", { exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Далі: критерії" }).click();
  const judgment = page.getByRole("button", { name: "Досвід роботи — Помірна перевага", exact: true });
  await judgment.click();
  await expect(judgment).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Швидке налаштування (WSM)", exact: true }).click();
  await expect(page.getByRole("slider", { name: /Досвід роботи/ })).toBeVisible();
});

test("specialist district survives reload and resets only when the city changes", async ({ page }) => {
  await registerSpecialist(page, uniqueEmail("e2e-spec-district"));
  await fillMinimalSpecialistProfile(page);
  const catalog = (await (await page.request.get(`${apiBase()}/catalog`)).json()).data;
  const district = catalog.districts[0];
  const update = await page.request.put(`${apiBase()}/specialist/me`, {
    data: { cityId: district.cityId, districtId: district.id }, headers: { Origin: clientOrigin() },
  });
  expect(update.status()).toBe(200);
  await page.goto("/specialist/profile/edit");
  await expect(page.getByLabel("Район", { exact: true })).toHaveValue(district.id);
  await page.reload();
  await expect(page.getByLabel("Район", { exact: true })).toHaveValue(district.id);
  const otherCity = catalog.cities.find((city: { id: string }) => city.id !== district.cityId);
  await page.getByLabel("Місто", { exact: true }).selectOption(otherCity.id);
  await expect(page.getByLabel("Район", { exact: true })).toHaveValue("");
});

test("admin searches the full user dataset on the server", async ({ page }) => {
  const email = process.env.SEED_ADMIN_EMAIL!;
  expect((await apiLogin(page.request, email, process.env.SEED_ADMIN_PASSWORD!)).status()).toBe(200);
  await page.goto("/admin/users");
  const response = page.waitForResponse(r => r.url().includes("/api/v1/admin/users?") && new URL(r.url()).searchParams.get("q") === email);
  await page.getByRole("searchbox", { name: "Пошук користувачів за ПІБ або email" }).fill(email);
  expect((await response).status()).toBe(200);
  await expect(page.getByRole("cell", { name: email, exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Пагінація користувачів" })).toBeVisible();
});
