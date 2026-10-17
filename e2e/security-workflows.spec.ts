import { expect, test } from "@playwright/test";
import { API_BASE, CLIENT_ORIGIN, registerPatient, uniqueEmail } from "./helpers";

test("guest is redirected from protected dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("patient cannot open admin panel UI", async ({ page }) => {
  const email = uniqueEmail("e2e-sec-patient");
  await registerPatient(page, email);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Доступ заборонено" })).toBeVisible();
});

test("logout revokes session for private API", async ({ page }) => {
  const email = uniqueEmail("e2e-logout");
  const password = "E2EPass12345!";
  await registerPatient(page, email, password);

  const meBefore = await page.request.get(`${API_BASE}/auth/me`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(meBefore.status()).toBe(200);

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Вийти" }).click();
  await expect(page).toHaveURL(/\/login$/);

  const meAfter = await page.request.get(`${API_BASE}/auth/me`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(meAfter.status()).toBe(401);
});

test("unauthenticated recommendation API returns 401", async ({ request }) => {
  const res = await request.get(`${API_BASE}/recommendations`, {
    headers: { Origin: CLIENT_ORIGIN },
  });
  expect(res.status()).toBe(401);
});
