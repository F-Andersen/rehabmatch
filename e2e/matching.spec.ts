import { expect, test } from "@playwright/test";

const unique = Date.now();

test("patient can run matching flow to recommendations", async ({ page }) => {
  await page.goto("/register");
  await page.locator("#fullName").fill("E2E Matching");
  await page.locator("#email").fill(`e2e-match-${unique}@example.test`);
  await page.locator("#role").selectOption("PATIENT");
  await page.locator("#password").fill("E2EMatchPass1!");
  await page.locator("#confirmPassword").fill("E2EMatchPass1!");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Зареєструватися" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/matching/new");
  await expect(page.getByRole("heading", { name: "Персоналізований підбір" })).toBeVisible();

  await page.locator("select").first().selectOption({ index: 1 });
  await page.getByRole("button", { name: "Далі: критерії" }).click();
  await expect(page).toHaveURL(/\/matching\/[a-f0-9-]+\/criteria$/i);

  for (let i = 0; i < 10; i += 1) {
    await page.getByRole("button", { name: /Однакова важливість/ }).first().click();
    if (i < 9) {
      await page.getByRole("button", { name: "Далі" }).click();
    }
  }

  await page.getByRole("button", { name: "Попередній розрахунок" }).click();
  await expect(page.getByText("Ваги критеріїв")).toBeVisible({ timeout: 15_000 });

  await expect(page.getByRole("button", { name: "Отримати рекомендації" })).toBeEnabled();
  await page.getByRole("button", { name: "Отримати рекомендації" }).click();
  await expect(page).toHaveURL(/\/recommendations\/[a-f0-9-]+$/i, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Персоналізовані рекомендації" })).toBeVisible();
});
