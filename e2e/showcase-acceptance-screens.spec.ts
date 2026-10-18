import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { apiLogin } from "./helpers";

loadEnv({ path: resolve(process.cwd(), ".env.showcase") });

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
function shotPath(name: string, viewport: string) {
  return `docs/thesis/screenshots/showcase-${name}-${viewport}.png`;
}

test.describe("showcase acceptance screenshots", () => {
  test("capture showcase UI", async ({ page }, testInfo) => {
    const viewport =
      testInfo.project.name === "showcase-mobile" ? "mobile-375" : "desktop-1440";

    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Знайдіть спеціаліста з реабілітації відповідно до ваших потреб",
      }),
    ).toBeVisible();
    await page.screenshot({ path: shotPath("home", viewport), fullPage: true });

    await page.goto("/specialists");
    await expect(page.getByRole("heading", { name: "Пошук спеціалістів" })).toBeVisible();
    await page.screenshot({ path: shotPath("catalog", viewport), fullPage: true });

    const profileHref = await page.locator('a[href^="/specialists/"]').first().getAttribute("href");
    expect(profileHref).toBeTruthy();
    await page.goto(profileHref!);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.screenshot({ path: shotPath("specialist-profile", viewport), fullPage: true });

    if (adminEmail && adminPassword) {
      const adminLogin = await apiLogin(page.request, adminEmail, adminPassword);
      expect(adminLogin.status(), await adminLogin.text()).toBe(200);
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Огляд системи" })).toBeVisible();
      await page.screenshot({ path: shotPath("admin-dashboard", viewport), fullPage: true });

      await page.goto("/admin/users");
      await expect(page.getByRole("heading", { name: "Користувачі" })).toBeVisible();
      await page.screenshot({ path: shotPath("admin-users", viewport), fullPage: true });

      await page.goto("/admin/reviews");
      await expect(page.getByRole("heading", { name: "Модерація відгуків" })).toBeVisible();
      await page.screenshot({ path: shotPath("admin-reviews", viewport), fullPage: true });
    }

    const patientPassword = process.env.SHOWCASE_SEED_PASSWORD;
    if (patientPassword) {
      const patientLogin = await apiLogin(
        page.request,
        "showcase.patient-01@example.test",
        patientPassword,
      );
      expect(patientLogin.status(), await patientLogin.text()).toBe(200);
      await page.goto("/matching/new");
      await page.locator("select").first().selectOption({ index: 1 });
      await page.getByRole("button", { name: "Далі: критерії" }).click();
      await expect(page).toHaveURL(/\/matching\/[a-f0-9-]+\/criteria$/i);
      await page.screenshot({ path: shotPath("ahp-wizard", viewport), fullPage: true });

      await page.goto("/recommendations");
      await expect(page.getByRole("heading", { name: "Історія рекомендацій" })).toBeVisible();
      await page.screenshot({ path: shotPath("recommendations", viewport), fullPage: true });
    }
  });
});
