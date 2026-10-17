import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const root = resolve(process.cwd());
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.e2e"), override: true });

const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;
const apiPort = process.env.API_PORT ?? "3011";
const clientPort = process.env.CLIENT_PORT ?? "5174";

const serverEnv: Record<string, string> = {
  ...Object.fromEntries(Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]),
  REHABMATCH_E2E: "1",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};

if (e2eDatabaseUrl) {
  serverEnv.DATABASE_URL = e2eDatabaseUrl;
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  globalSetup: resolve(root, "e2e/global-setup.mjs"),
  globalTeardown: resolve(root, "e2e/global-teardown.mjs"),
  use: {
    baseURL: `http://localhost:${clientPort}`,
    trace: "on-first-retry",
  },
  webServer: e2eDatabaseUrl
    ? [
        {
          command: "npm run dev -w server",
          url: `http://localhost:${apiPort}/api/v1/health`,
          reuseExistingServer: false,
          timeout: 120_000,
          env: serverEnv,
        },
        {
          command: "npm run dev -w client",
          url: `http://localhost:${clientPort}`,
          reuseExistingServer: false,
          timeout: 120_000,
          env: {
            ...Object.fromEntries(
              Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][],
            ),
            CLIENT_PORT: clientPort,
            API_PORT: apiPort,
            CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? `http://localhost:${clientPort}`,
          },
        },
      ]
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /visual-qa\.spec\.ts/,
    },
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
    {
      name: "chromium-visual",
      testMatch: /visual-qa\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
