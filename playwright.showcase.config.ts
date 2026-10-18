import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const root = resolve(process.cwd());
loadEnv({ path: resolve(root, ".env") });
loadEnv({ path: resolve(root, ".env.showcase"), override: true });

process.env.REHABMATCH_SHOWCASE_E2E = "1";
process.env.REHABMATCH_E2E = "1";

const clientPort = process.env.CLIENT_PORT ?? "5184";
const apiPort = process.env.API_PORT ?? "3021";
const clientOrigin = process.env.CLIENT_ORIGIN ?? `http://localhost:${clientPort}`;

const showcaseDatabaseUrl = process.env.SHOWCASE_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  testDir: "./e2e",
  testMatch: [/showcase-smoke\.spec\.ts/, /showcase-acceptance-screens\.spec\.ts/],
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: clientOrigin,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev:showcase",
    url: `${clientOrigin}/`,
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][],
      ),
      DATABASE_URL: showcaseDatabaseUrl,
      CLIENT_PORT: clientPort,
      API_PORT: apiPort,
      CLIENT_ORIGIN: clientOrigin,
      REHABMATCH_E2E: "1",
    },
  },
  projects: [
    {
      name: "showcase-desktop",
      testMatch: /showcase-acceptance-screens\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "showcase-mobile",
      testMatch: /showcase-acceptance-screens\.spec\.ts/,
      use: { viewport: { width: 375, height: 812 } },
    },
    {
      name: "showcase-chromium",
      testMatch: /showcase-smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
