import { expect, test } from "@playwright/test";

const artifactDir = "e2e/artifacts/visual-qa";

const pages = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
  { name: "register", path: "/register" },
  { name: "catalog", path: "/specialists" },
];

for (const entry of pages) {
  test(`visual snapshot ${entry.name}`, async ({ page }) => {
    await page.goto(entry.path);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: `${artifactDir}/${entry.name}-${test.info().project.name}.png`,
      fullPage: true,
    });
  });
}

test("visual specialist profile", async ({ page }) => {
  await page.goto("/specialists");
  await page.getByRole("link", { name: "Переглянути профіль" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({
    path: `${artifactDir}/specialist-profile-${test.info().project.name}.png`,
    fullPage: true,
  });
});
