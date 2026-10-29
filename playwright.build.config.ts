import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-build",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5186",
    browserName: "chromium",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "npm run preview -w client -- --host 127.0.0.1 --port 5186 --strictPort",
    url: "http://127.0.0.1:5186",
    reuseExistingServer: false,
  },
});
