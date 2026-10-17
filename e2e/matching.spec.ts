import { expect, test } from "@playwright/test";
import { registerPatient, uniqueEmail } from "./helpers";

test("patient can run matching flow to recommendations", async ({ page }) => {
  await registerPatient(page, uniqueEmail("e2e-match"), "E2EMatchPass1!");

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
  const createRecommendation = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/recommendations") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Отримати рекомендації" }).click();
  const recommendationResponse = await createRecommendation;
  expect(
    recommendationResponse.status(),
    await recommendationResponse.text(),
  ).toBe(201);
  await expect(page).toHaveURL(/\/recommendations\/[a-f0-9-]+$/i);
  await expect(page.getByRole("heading", { name: "Персоналізовані рекомендації" })).toBeVisible();
});
