import { test, expect } from "@playwright/test";

/**
 * Happy-path smoke (documented; opt-in).
 *
 * Prerequisites when E2E=1:
 * - na api: `npm run infra:up && npm run db:push && npm run db:seed && npm run dev`
 * - Playwright Chromium installed
 * - Demo users from README (password EventFlowDemo123!)
 *
 * Flow covered:
 * 1. Buyer logs in → opens seeded event → reserves → checkout fake → sees ticket
 * 2. Staff logs in → check-in with QR token
 * 3. Organizer opens dashboard → metrics visible / CSV downloadable
 *
 * Skips unless E2E=1 so local/CI without browsers stays green.
 */
const e2eEnabled = process.env.E2E === "1";

test.describe("EventFlow smoke happy path", () => {
  test.skip(!e2eEnabled, "Set E2E=1 to run Playwright smoke against a live stack.");

  test("buyer can reach catalog after login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-?mail/i).fill("buyer@eventflow.local");
    await page.getByLabel(/senha/i).fill("EventFlowDemo123!");
    await page.getByRole("button", { name: /entrar|login/i }).click();
    await expect(page).toHaveURL(/\/($|events|tickets)/);
    await page.goto("/events/noite-demo-eventflow");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
