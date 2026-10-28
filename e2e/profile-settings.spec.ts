import { expect, test } from "@playwright/test";
import { apiBase, apiLogin, clientOrigin, registerPatient, registerSpecialist, uniqueEmail } from "./helpers";

test("patient city persists, rejects unknown cities and can be cleared", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-city"));
  const catalog = (await (await page.request.get(`${apiBase()}/catalog`)).json()).data;
  const cityId = catalog.cities[0].id;
  await page.goto("/profile");
  await expect(page.getByRole("combobox", { name: "Місто", exact: true })).toBeEnabled();
  await page.getByRole("combobox", { name: "Місто", exact: true }).selectOption(cityId);
  await page.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(page.getByText("Профіль оновлено.", { exact: true })).toBeVisible();
  expect((await (await page.request.get(`${apiBase()}/auth/me`)).json()).data.cityId).toBe(cityId);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Місто", exact: true })).toHaveValue(cityId);
  const invalid = await page.request.patch(`${apiBase()}/me`, {
    data: { cityId: "00000000-0000-4000-8000-000000000001", fullName: "Must not be saved" }, headers: { Origin: clientOrigin() },
  });
  expect(invalid.status()).toBe(400);
  const unchanged = (await (await page.request.get(`${apiBase()}/auth/me`)).json()).data;
  expect(unchanged.cityId).toBe(cityId);
  expect(unchanged.fullName).toBe("E2E Patient");
  await page.goto("/matching/new");
  await expect(page.locator("select").nth(2)).toHaveValue(cityId);
  await page.goto("/profile");
  await expect(page.getByRole("combobox", { name: "Місто", exact: true })).toBeEnabled();
  await page.getByRole("combobox", { name: "Місто", exact: true }).selectOption("");
  await page.getByRole("button", { name: "Зберегти", exact: true }).click();
  await expect(page.getByText("Профіль оновлено.", { exact: true })).toBeVisible();
  expect((await (await page.request.get(`${apiBase()}/auth/me`)).json()).data.cityId).toBeNull();
});

test("patient settings keep patient navigation and link to the patient profile", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-settings-patient"));
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Налаштування облікового запису" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Меню пацієнта" })).toBeVisible();
  await page.getByRole("link", { name: "Редагувати мій профіль" }).click();
  await expect(page).toHaveURL(/\/profile$/);
});

test("specialist settings link to own profile and cannot change patient city", async ({ page }) => {
  await registerSpecialist(page, uniqueEmail("e2e-settings-specialist"));
  const catalog = (await (await page.request.get(`${apiBase()}/catalog`)).json()).data;
  const forbidden = await page.request.patch(`${apiBase()}/me`, {
    data: { cityId: catalog.cities[0].id }, headers: { Origin: clientOrigin() },
  });
  expect(forbidden.status()).toBe(403);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Налаштування облікового запису" })).toBeVisible();
  await page.getByRole("link", { name: "Редагувати мій профіль" }).click();
  await expect(page).toHaveURL(/\/specialist\/profile\/edit$/);
});

test("admin settings use admin navigation without a patient-profile link", async ({ page }) => {
  const login = await apiLogin(page.request, process.env.SEED_ADMIN_EMAIL!, process.env.SEED_ADMIN_PASSWORD!);
  expect(login.status()).toBe(200);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Налаштування облікового запису" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Адмін-меню" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Редагувати мій профіль" })).toHaveCount(0);
  await expect(page.getByText("Адміністратор", { exact: true })).toBeVisible();
});
