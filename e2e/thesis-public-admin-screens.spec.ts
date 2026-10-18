import { expect, test } from "@playwright/test";
import { apiLogin } from "./helpers";

const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

async function shot(page: import("@playwright/test").Page, name: string) {
  await page.screenshot({
    path: `docs/thesis/screenshots/${name}-desktop-1440.png`,
    fullPage: true,
  });
}

test.describe("thesis public and admin screens", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("public pages", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Знайдіть спеціаліста з реабілітації відповідно до ваших потреб",
      }),
    ).toBeVisible();
    await shot(page, "home");

    await page.goto("/about");
    await expect(page.getByRole("heading", { name: "Про систему RehabMatch" })).toBeVisible();
    await shot(page, "about");

    await page.goto("/how-it-works");
    await expect(page.getByRole("heading", { name: "Як це працює" })).toBeVisible();
    await shot(page, "how-it-works");

    await page.goto("/contacts");
    await expect(page.getByRole("heading", { name: "Контакти та підтримка" })).toBeVisible();
    await shot(page, "contacts");

    await page.goto("/specialists");
    await expect(page.getByRole("heading", { name: "Пошук спеціалістів" })).toBeVisible();
    await shot(page, "catalog");

    const profileLink = page.locator('a[href^="/specialists/"]').first();
    await profileLink.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await shot(page, "specialist-profile");
  });

  test("admin sections", async ({ page }) => {
    test.skip(!adminEmail || !adminPassword, "SEED_ADMIN_* required");
    const login = await apiLogin(page.request, adminEmail!, adminPassword!);
    expect(login.status()).toBe(200);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Огляд системи" })).toBeVisible();
    await shot(page, "admin-dashboard");

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Користувачі" })).toBeVisible();
    await shot(page, "admin-users");

    await page.goto("/admin/specialists");
    await expect(page.getByRole("heading", { name: "Модерація спеціалістів" })).toBeVisible();
    await shot(page, "admin-specialists");

    await page.goto("/admin/reviews");
    await expect(page.getByRole("heading", { name: "Модерація відгуків" })).toBeVisible();
    await shot(page, "admin-reviews");

    await page.goto("/admin/requests");
    await expect(page.getByRole("heading", { name: "Заявки на консультацію" })).toBeVisible();
    await shot(page, "admin-requests");

    await page.goto("/admin/dictionaries");
    await expect(page.getByRole("heading", { name: "Довідники" })).toBeVisible();
    await shot(page, "admin-dictionaries");
  });
});
