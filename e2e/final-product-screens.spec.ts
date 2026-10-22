import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { apiLogin } from "./helpers";

loadEnv({ path: resolve(process.cwd(), ".env.showcase") });

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const patientPassword = process.env.SHOWCASE_SEED_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;

function shot(name: string) {
  return `docs/thesis/screenshots/final-product/${name}-desktop-1440.png`;
}

test.describe("final product screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("capture public and role pages", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Знайдіть спеціаліста/i })).toBeVisible();
    await page.screenshot({ path: shot("home"), fullPage: true });

    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /Про систему RehabMatch/i })).toBeVisible();
    await page.screenshot({ path: shot("about"), fullPage: true });

    await page.goto("/how-it-works");
    await expect(page.getByRole("heading", { name: "Як це працює" })).toBeVisible();
    await page.screenshot({ path: shot("how-it-works"), fullPage: true });

    await page.goto("/specialists");
    await expect(page.getByRole("heading", { name: "Пошук спеціалістів" })).toBeVisible();
    await page.screenshot({ path: shot("catalog"), fullPage: true });

    const profileHref = await page.locator('a[href^="/specialists/"]').first().getAttribute("href");
    expect(profileHref).toBeTruthy();
    await page.goto(profileHref!);
    await page.screenshot({ path: shot("specialist-profile"), fullPage: true });

    if (patientPassword) {
      const login = await apiLogin(page.request, "showcase.patient-01@example.test", patientPassword);
      expect(login.status(), await login.text()).toBe(200);
      await page.goto("/dashboard");
      await expect(page.getByRole("heading", { name: "Огляд" })).toBeVisible();
      await page.screenshot({ path: shot("patient-dashboard"), fullPage: true });

      await page.goto("/profile");
      await expect(page.getByRole("heading", { name: "Мій профіль" })).toBeVisible();
      await page.screenshot({ path: shot("patient-profile"), fullPage: true });

      await page.goto("/matching/new");
      await page.locator("select").first().selectOption({ index: 1 });
      await page.getByRole("button", { name: "Далі: критерії" }).click();
      await expect(page).toHaveURL(/\/matching\/[a-f0-9-]+\/criteria$/i);
      await page.screenshot({ path: shot("ahp-wizard"), fullPage: true });

      await page.goto("/recommendations");
      await expect(page.getByRole("heading", { name: "Історія рекомендацій" })).toBeVisible();
      await page.screenshot({ path: shot("recommendations"), fullPage: true });
    }

    if (patientPassword) {
      const specLogin = await apiLogin(page.request, "specialist.sc-001@example.test", patientPassword);
      if (specLogin.status() === 200) {
        await page.goto("/specialist/dashboard");
        await expect(page.getByRole("heading", { name: "Огляд" })).toBeVisible();
        await page.screenshot({ path: shot("specialist-dashboard"), fullPage: true });
      }
    }

    if (adminEmail && adminPassword) {
      await apiLogin(page.request, adminEmail, adminPassword);
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Огляд системи" })).toBeVisible();
      await page.screenshot({ path: shot("admin-dashboard"), fullPage: true });

      await page.goto("/admin/users");
      await page.screenshot({ path: shot("admin-users"), fullPage: true });

      await page.goto("/admin/specialists");
      await page.screenshot({ path: shot("admin-specialists"), fullPage: true });

      await page.goto("/admin/reviews");
      await page.screenshot({ path: shot("admin-reviews"), fullPage: true });

      await page.goto("/admin/requests");
      await page.screenshot({ path: shot("admin-requests"), fullPage: true });
    }
  });
});
