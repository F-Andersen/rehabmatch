import { expect, test } from "@playwright/test";
import {
  apiLogin,
  fillMinimalSpecialistProfile,
  logoutIfNeeded,
  registerPatient,
  registerSpecialist,
  uniqueEmail,
} from "./helpers";

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

async function shot(page: import("@playwright/test").Page, name: string, viewport: string) {
  await page.screenshot({
    path: `docs/thesis/screenshots/${name}-${viewport}.png`,
    fullPage: true,
  });
}

for (const viewport of [
  { tag: "desktop-1440", width: 1440, height: 900 },
  { tag: "mobile-375", width: 375, height: 812 },
] as const) {
  test(`thesis app screens ${viewport.tag}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    const patientEmail = uniqueEmail(`vis-p-${viewport.tag}`);
    await registerPatient(page, patientEmail);

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Кабінет пацієнта" })).toBeVisible();
    await shot(page, "patient-dashboard", viewport.tag);

    await page.goto("/matching/new");
    await page.locator("select").first().selectOption({ index: 1 });
    await page.getByRole("button", { name: "Далі: критерії" }).click();
    await expect(page).toHaveURL(/\/matching\/[a-f0-9-]+\/criteria$/i);
    await shot(page, "matching-ahp-wizard", viewport.tag);

    await page.getByRole("button", { name: /Швидке налаштування \(WSM\)/ }).click();
    await shot(page, "matching-direct-wsm", viewport.tag);

    await page.getByRole("button", { name: /Попарне порівняння \(AHP\)/ }).click();
    for (let i = 0; i < 10; i += 1) {
      await page.getByRole("button", { name: /Однакова важливість/ }).first().click();
      if (i < 9) await page.getByRole("button", { name: "Далі" }).click();
    }
    await page.getByRole("button", { name: "Попередній розрахунок" }).click();
    await expect(page.getByText("Ваги критеріїв")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Отримати рекомендації" }).click();
    await expect(page).toHaveURL(/\/recommendations\/[a-f0-9-]+$/i);
    await expect(page.getByRole("heading", { name: "Персоналізовані рекомендації" })).toBeVisible();
    await shot(page, "recommendations-results", viewport.tag);

    await page.goto("/my-requests");
    await expect(page.getByRole("heading", { name: /заявки на консультацію/i })).toBeVisible();
    await shot(page, "patient-requests", viewport.tag);

    await logoutIfNeeded(page);
    const specEmail = uniqueEmail(`vis-s-${viewport.tag}`);
    await registerSpecialist(page, specEmail);
    await fillMinimalSpecialistProfile(page);
    await page.goto("/specialist/dashboard");
    await shot(page, "specialist-dashboard", viewport.tag);
    await page.goto("/specialist/requests");
    await shot(page, "specialist-requests", viewport.tag);

    if (adminEmail && adminPassword) {
      await logoutIfNeeded(page);
      const adminLogin = await apiLogin(page.request, adminEmail, adminPassword);
      expect(adminLogin.status()).toBe(200);
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: /Панель адміністратора/i })).toBeVisible();
      await shot(page, "admin-panel", viewport.tag);
      await page.goto("/admin/reviews");
      await shot(page, "admin-reviews", viewport.tag);
    }
  });
}
