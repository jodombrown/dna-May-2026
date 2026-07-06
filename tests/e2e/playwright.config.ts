import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E for the DNA mobile shell.
 *
 * Not wired into `bun test` (vitest) or CI by default.
 * To run locally against a dev server on :8080:
 *   bun add -D @playwright/test && bunx playwright install chromium
 *   bunx playwright test --config tests/e2e/playwright.config.ts
 */
export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
