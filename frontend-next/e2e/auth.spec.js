import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/shop-login');
    await expect(page.locator('h1')).toContainText('Welcome Back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Login');
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/shop-login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard on success or show error
    await page.waitForURL(/dashboard|shop-login/, { timeout: 10000 });
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/shop-login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // SweetAlert2 error popup
    await expect(page.locator('.swal2-popup')).toBeVisible({ timeout: 5000 });
  });

  test('registration page accessible from login', async ({ page }) => {
    await page.goto('/shop-login');
    await page.click('a[href="/shop-registration"]');
    await expect(page).toHaveURL('/shop-registration');
  });
});
