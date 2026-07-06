import { test } from '@playwright/test';
import { assertMobileShellScrollBehavior } from './helpers/mobileShell';

/**
 * Verifies DnaMobileHubShell scroll semantics across the three hubs that
 * were re-shelled: the top bar hides on scroll-down while tabs and the
 * MobileBottomNav stay fixed. Assumes an authenticated session (see
 * playwright.config.ts for auth wiring) or a public-safe entry route.
 */
test.describe('DNA mobile hub shell - scroll behavior', () => {
  test('Discover: top bar hides, tabs + bottom nav pinned', async ({ page }) => {
    await assertMobileShellScrollBehavior(page, '/dna/connect/discover');
  });

  test('Connect: top bar hides, tabs + bottom nav pinned', async ({ page }) => {
    await assertMobileShellScrollBehavior(page, '/dna/connect');
  });

  test('Contribute: top bar hides, tabs + bottom nav pinned', async ({ page }) => {
    await assertMobileShellScrollBehavior(page, '/dna/contribute');
  });
});
