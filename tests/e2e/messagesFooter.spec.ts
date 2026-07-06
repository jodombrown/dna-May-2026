import { test, expect } from '@playwright/test';

/**
 * Regression: the Messages page must mount MobileBottomNav (identical to
 * Discover / Connect / Contribute). This test was added after users reported
 * the footer menu was missing on /dna/messages.
 */
test.describe('Messages mobile chrome', () => {
  test('renders the MobileBottomNav in the same fixed position as other DNA hubs', async ({ page }) => {
    await page.goto('/dna/messages');

    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]').first();
    await expect(bottomNav).toBeVisible();
    const messagesBox = await bottomNav.boundingBox();
    expect(messagesBox).not.toBeNull();

    // Compare with Discover's bottom nav to confirm identical placement.
    await page.goto('/dna/connect/discover');
    const discoverNav = page.locator('[data-testid="mobile-bottom-nav"]').first();
    await expect(discoverNav).toBeVisible();
    const discoverBox = await discoverNav.boundingBox();
    expect(discoverBox).not.toBeNull();

    expect(Math.round(messagesBox!.y)).toBe(Math.round(discoverBox!.y));
    expect(Math.round(messagesBox!.height)).toBe(Math.round(discoverBox!.height));
  });
});
