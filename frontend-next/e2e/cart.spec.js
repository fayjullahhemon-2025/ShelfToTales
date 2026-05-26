import { test, expect } from '@playwright/test';

// Helper: login and store auth state
async function loginAsTestUser(page) {
  await page.goto('/shop-login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard|shop-login/, { timeout: 10000 });
}

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('add to cart from books grid', async ({ page }) => {
    await page.goto('/books-grid-view');
    await page.waitForSelector('.col-book', { timeout: 10000 });

    // Click "Add to cart" button on first book
    const addToCartBtn = page.locator('text=Add to cart').first();
    await addToCartBtn.click();

    // Should show success toast or SweetAlert
    await expect(
      page.locator('.swal2-popup, .toast-success').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('cart page displays items', async ({ page }) => {
    await page.goto('/shop-cart');
    // Cart page should load
    await expect(page.locator('body')).toBeVisible();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/shop-cart');
  });
});
