import { expect, test } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";

// Exercise the real production chunks; no live database or production mutations.
test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/**", (route) => route.fulfill({
    status: route.request().url().endsWith("/auth/me") ? 401 : 503,
    contentType: "application/json",
    body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "Test API unavailable" } }),
  }));
});

test("home does not request private portal or form chunks", async ({ page }) => {
  const html = readFileSync("client/dist/index.html", "utf8");
  const entry = html.match(/src="(\/assets\/[^"]+\.js)"/)?.[1];
  expect(entry).toBeTruthy();
  expect(statSync(`client/dist${entry}`).size).toBeLessThan(500_000);
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") scripts.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Контакти", exact: true }).first()).toBeVisible();
  expect(scripts.some((url) => /(?:AdminPages|PatientPages|SpecialistPortalPages|LoginPage|RegisterPage|types|schemas|coerce)-/.test(url))).toBe(false);
  expect(scripts.some((url) => /\/assets\/index-.*\.js/.test(url))).toBe(true);
});

test("direct contacts load has a loading state and keeps navigation", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/assets/StaticPages-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/contacts", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("status")).toHaveText("Завантаження сторінки…");
    await expect(page.getByRole("navigation", { name: "Головна навігація" })).toBeVisible();
  } finally {
    release();
  }
  await expect(page.getByRole("heading", { name: "Контакти та підтримка" })).toBeVisible();
});

test("failed chunk has a recoverable error instead of a blank page", async ({ page }) => {
  const pattern = "**/assets/StaticPages-*.js";
  await page.route(pattern, (route) => route.abort());
  await page.goto("/contacts");
  await expect(page.getByRole("alert")).toContainText("Не вдалося відкрити сторінку");
  await expect(page.getByRole("navigation", { name: "Головна навігація" })).toBeVisible();
  await page.getByRole("navigation", { name: "Головна навігація" }).getByRole("link", { name: "Головна", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Не вдалося відкрити сторінку" })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Головна навігація" }).getByRole("link", { name: "Контакти", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Не вдалося відкрити сторінку");
  await page.unroute(pattern);
  await page.getByRole("button", { name: "Оновити сторінку" }).click();
  await expect(page.getByRole("heading", { name: "Контакти та підтримка" })).toBeVisible();
});

test("protected direct route still redirects a guest to login", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "Увійти", exact: true })).toBeVisible();
});

test("a link at the bottom opens the next page at its heading", async ({ page }) => {
  await page.goto("/contacts");
  await page.getByRole("link", { name: "каталог спеціалістів", exact: true }).click();
  await expect(page).toHaveURL(/\/specialists$/);
  await expect(page.getByRole("heading", { name: "Пошук спеціалістів", exact: true })).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
