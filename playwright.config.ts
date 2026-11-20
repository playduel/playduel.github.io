import { defineConfig, devices } from "@playwright/test";

// PW_CHROME_PATH lets the tests use an already-installed Chrome
// (e.g. in sandboxes where Playwright can't download its own).
const executablePath = process.env.PW_CHROME_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:4173",
    ...devices["Pixel 7"],
    launchOptions: { executablePath },
  },
  webServer: {
    // --mode e2e skips .env.production, so tests never touch the real leaderboard or analytics.
    command: "tsc -b && vite build --mode e2e && vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
