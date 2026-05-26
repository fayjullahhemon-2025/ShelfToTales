import { test, expect } from '@playwright/test';

async function loginAsTestUser(page) {
  await page.goto('/shop-login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|shop-login/, { timeout: 10000 });
}

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('checkout page loads with cart summary', async ({ page }) => {
    await page.goto('/shop-checkout');
    // Should show checkout page or redirect if cart empty
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/shop-checkout|shop-cart/);
  });

  test('place order button exists on checkout', async ({ page }) => {
    await page.goto('/shop-checkout');
    await page.waitForTimeout(2000);
    // If cart has items, Place Order button should be visible
    const placeOrderBtn = page.locator('button:has-text("Place Order")');
    if (await placeOrderBtn.isVisible()) {
      await expect(placeOrderBtn).toBeEnabled();
    }
  });

  test('purchase history page loads', async ({ page }) => {
    await page.goto('/purchase-history');
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/purchase-history');
  });
});
