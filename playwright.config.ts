import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: resolve(process.cwd(), ".env") });

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-375",
      testMatch: /visual-qa\.spec\.ts/,
      use: { ...devices["Pixel 5"], viewport: { width: 375, height: 812 } },
    },
    {
      name: "tablet-768",
      testMatch: /visual-qa\.spec\.ts/,
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: "desktop-1440",
      testMatch: /visual-qa\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
});
