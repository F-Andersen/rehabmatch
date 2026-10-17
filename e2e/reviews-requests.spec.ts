import { expect, test } from "@playwright/test";

test("specialist profile shows reviews block on public profile", async ({ page }) => {
  await page.goto("/specialists");
  const profileLink = page.getByRole("link", { name: "Переглянути профіль" }).first();
  await expect(profileLink).toBeVisible({ timeout: 15_000 });
  await profileLink.click();
  await expect(page.getByRole("heading", { name: "Відгуки" })).toBeVisible();
  await expect(page.getByText(/схвалених|немає схвалених/i).first()).toBeVisible();
});

test("guest sees login prompt for consultation request", async ({ page }) => {
  await page.goto("/specialists");
  await page.getByRole("link", { name: "Переглянути профіль" }).first().click();
  await expect(page.getByText(/увійдіть/i).first()).toBeVisible();
});
