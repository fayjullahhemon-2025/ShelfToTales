import { test, expect } from '@playwright/test';

test.describe('Book Browsing', () => {
  test('homepage loads with book content', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ShelfToTales|Book/i);
    // Page should have navigation and content
    await expect(page.locator('header')).toBeVisible();
  });

  test('books grid view displays books', async ({ page }) => {
    await page.goto('/books-grid-view');
    await expect(page.locator('h4')).toContainText('Books Grid');
    // Wait for books to load
    await page.waitForSelector('.col-book', { timeout: 10000 });
    const bookCards = page.locator('.col-book');
    expect(await bookCards.count()).toBeGreaterThan(0);
  });

  test('book detail page loads on click', async ({ page }) => {
    await page.goto('/books-grid-view');
    await page.waitForSelector('.col-book', { timeout: 10000 });
    // Click first book link
    const firstBookLink = page.locator('.col-book a').first();
    await firstBookLink.click();
    await expect(page).toHaveURL(/shop-detail\/\d+/);
  });

  test('book list view works', async ({ page }) => {
    await page.goto('/book-list');
    await expect(page.locator('body')).toBeVisible();
    // Should load without errors
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/book-list');
  });
});
