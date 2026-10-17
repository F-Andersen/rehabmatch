import type { APIRequestContext, Page } from "@playwright/test";

export const CLIENT_ORIGIN = "http://localhost:5173";
export const API_BASE = "http://localhost:3001/api/v1";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.test`;
}

export async function registerPatient(page: Page, email: string, password = "E2EPass12345!") {
  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Patient");
  await page.locator("#email").fill(email);
  await page.locator("#role").selectOption("PATIENT");
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Зареєструватися" }).click();
  await page.waitForURL(/\/dashboard$/);
}

export function specialistDisplayName(email: string) {
  return `E2E Specialist ${email.split("@")[0]}`;
}

export async function registerSpecialist(page: Page, email: string, password = "E2ESpecPass123!") {
  await page.goto("/register");
  await page.locator("#fullName").fill(specialistDisplayName(email));
  await page.locator("#email").fill(email);
  await page.locator("#role").selectOption("SPECIALIST");
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Зареєструватися" }).click();
  await page.waitForURL(/\/specialist\/dashboard$/);
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Увійти" }).click();
}

export async function apiLogin(request: APIRequestContext, email: string, password: string) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password },
    headers: { Origin: CLIENT_ORIGIN },
  });
  return res;
}

export async function fillMinimalSpecialistProfile(page: Page) {
  const catalogRes = await page.request.get(`${API_BASE}/catalog`);
  if (!catalogRes.ok()) {
    throw new Error(`Catalog fetch failed: ${catalogRes.status()}`);
  }
  const catalog = (await catalogRes.json()).data;
  const res = await page.request.put(`${API_BASE}/specialist/me`, {
    data: {
      cityId: catalog.cities[0].id,
      experienceYears: 5,
      pricePerSession: 1200,
      description: "E2E specialist profile for moderation",
      specializationIds: [catalog.specializations[0].id],
      injuryTypeIds: [catalog.injuryTypes[0].id],
      formatIds: [catalog.formats[0].id],
    },
    headers: { Origin: CLIENT_ORIGIN },
  });
  if (!res.ok()) {
    throw new Error(`Specialist profile update failed: ${res.status()} ${await res.text()}`);
  }
}

export async function logoutIfNeeded(page: Page) {
  const logout = page.getByRole("button", { name: "Вийти" });
  if (await logout.isVisible().catch(() => false)) {
    await logout.click();
    await page.waitForURL(/\/login$/);
  }
}
