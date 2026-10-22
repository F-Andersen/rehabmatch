import { expect, test } from "@playwright/test";

const unique = Date.now();

test("patient can register and reach dashboard", async ({ page }) => {
  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Пацієнт");
  await page.locator("#email").fill(`e2e-patient-${unique}@example.test`);
  await page.locator("#role").selectOption("PATIENT");
  await page.locator("#password").fill("E2EPass12345!");
  await page.locator("#confirmPassword").fill("E2EPass12345!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Зареєструватися" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Огляд" })).toBeVisible();
});
