import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke E2E is opt-in: set E2E=1 (and have browsers installed) to run.
 * Default CI/local `npm test` does not invoke Playwright.
 *
 * Install browsers once (optional):
 *   npx playwright install chromium
 */
const e2eEnabled = process.env.E2E === "1";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5174",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  // Keep config valid even when browsers are not installed; tests self-skip unless E2E=1.
  projects: e2eEnabled
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [{ name: "chromium-skip", testMatch: /smoke\.spec\.ts/ }],
});
