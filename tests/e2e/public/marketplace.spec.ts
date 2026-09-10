import { test, expect } from '@playwright/test';

test.describe('Marketplace Listing', () => {
  test('/vehicles page loads', async ({ page }) => {
    const response = await page.goto('/vehicles');
    expect(response?.status()).toBe(200);
  });

  test('vehicle cards are displayed', async ({ page }) => {
    await page.goto('/vehicles');
    const cards = page.locator('[class*="card"], [data-testid*="vehicle"], article');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test('search functionality is present', async ({ page }) => {
    await page.goto('/vehicles');
    const searchInput = page.locator('input[type="search"], input[placeholder*="earch"], input[name*="search"]');
    await expect(searchInput).toBeVisible();
  });

  test('filter interaction', async ({ page }) => {
    await page.goto('/vehicles');
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("filter"), [data-testid*="filter"]');
    await expect(filterButton.first()).toBeVisible();
  });

  test('pagination is present', async ({ page }) => {
    await page.goto('/vehicles');
    const pagination = page.locator('nav[aria-label*="pagination"], nav[aria-label*="Pagination"], [class*="pagination"], button:has-text("Next"), a:has-text("Next")');
    await expect(pagination.first()).toBeVisible({ timeout: 15000 });
  });

  test('mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const response = await page.goto('/vehicles');
    expect(response?.status()).toBe(200);
    await expect(page.locator('main')).toBeVisible();
  });
});
