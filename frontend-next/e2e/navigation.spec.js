import { test, expect } from '@playwright/test';

test.describe('Navigation & Pages', () => {
  test('homepage loads without errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBeLessThan(400);
  });

  test('404 page for invalid routes', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await expect(page.locator('body')).toBeVisible();
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about-us');
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('/about-us');
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact-us');
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('/contact-us');
  });

  test('FAQ page loads', async ({ page }) => {
    await page.goto('/faq');
    await expect(page.locator('body')).toBeVisible();
    expect(page.url()).toContain('/faq');
  });
});
