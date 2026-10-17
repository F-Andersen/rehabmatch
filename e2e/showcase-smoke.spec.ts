import { expect, test } from "@playwright/test";

test.describe("showcase smoke", () => {
  test.skip(process.env.REHABMATCH_SHOWCASE_E2E !== "1", "Set REHABMATCH_SHOWCASE_E2E=1 with dev:showcase");

  test("catalog has no demo-style specialist names", async ({ page }) => {
    await page.goto("/specialists");
    await expect(page.getByRole("heading", { name: /спеціаліст/i })).toBeVisible();
    const body = await page.locator("main").innerText();
    expect(body).not.toMatch(/Демо\s+(Марія|Олександр|Сергій)/);
    expect(body).not.toContain("Lorem ipsum");
  });

  test("specialist cards load portrait images", async ({ page }) => {
    await page.goto("/specialists");
    const img = page.locator('main img[src*="/images/specialists/"]').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute("src", /sc-\d{3}\.webp/);
  });
});
