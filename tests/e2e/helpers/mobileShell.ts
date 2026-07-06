/**
 * Shared helper: scroll the page and assert that the DnaMobileHubShell top bar
 * collapses while the tabs row and MobileBottomNav remain pinned.
 *
 * The shell renders the top bar inside a fixed z-50 container; on scroll-down
 * the row wrapping <DnaMobileHeader /> collapses to `max-h-0 opacity-0`.
 * The `tabs` slot and MobileBottomNav sit outside that collapsing wrapper,
 * so their bounding boxes must stay stable.
 */
import { expect, type Page } from '@playwright/test';

export async function assertMobileShellScrollBehavior(page: Page, path: string) {
  await page.goto(path);

  // Wait for shell chrome.
  const topBar = page.locator('[data-testid="dna-mobile-header"]').first();
  const tabs = page.locator('[data-testid="hub-tabs"], [role="tablist"]').first();
  const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]').first();

  await expect(topBar).toBeVisible();
  await expect(bottomNav).toBeVisible();

  const tabsBoxBefore = await tabs.boundingBox();
  const bottomBoxBefore = await bottomNav.boundingBox();
  expect(tabsBoxBefore).not.toBeNull();
  expect(bottomBoxBefore).not.toBeNull();

  // Scroll down enough to trigger the hide-on-scroll threshold (>30px).
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' as ScrollBehavior }));
  await page.waitForTimeout(300);

  // Top bar collapses (height becomes ~0) but the wrapper is still in the DOM.
  const topBarBox = await topBar.boundingBox();
  expect(topBarBox?.height ?? 0).toBeLessThan(4);

  // Tabs + bottom nav remain fixed at the same coordinates.
  const tabsBoxAfter = await tabs.boundingBox();
  const bottomBoxAfter = await bottomNav.boundingBox();
  expect(Math.round(tabsBoxAfter?.y ?? -1)).toBe(Math.round(tabsBoxBefore?.y ?? -2));
  expect(Math.round(bottomBoxAfter?.y ?? -1)).toBe(Math.round(bottomBoxBefore?.y ?? -2));

  // Scroll back up: top bar restores.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }));
  await page.waitForTimeout(300);
  const topBarBoxRestored = await topBar.boundingBox();
  expect((topBarBoxRestored?.height ?? 0)).toBeGreaterThan(20);
}
