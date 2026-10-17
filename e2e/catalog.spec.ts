import { expect, test } from "@playwright/test";

test("guest can browse specialists catalog", async ({ page }) => {
  await page.goto("/specialists");
  await expect(page.getByRole("heading", { name: "Пошук спеціалістів" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Переглянути профіль" }).first()).toBeVisible({
    timeout: 15_000,
  });
});

test("guest can open specialist profile from catalog", async ({ page }) => {
  await page.goto("/specialists");
  const profileLink = page.getByRole("link", { name: "Переглянути профіль" }).first();
  await expect(profileLink).toBeVisible({ timeout: 15_000 });
  await profileLink.click();
  await expect(page).toHaveURL(/\/specialists\/[a-f0-9-]+$/i);
  await expect(page.getByRole("link", { name: "← До каталогу" })).toBeVisible();
});
