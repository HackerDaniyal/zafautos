import { test, expect } from '@playwright/test';

test.describe('Customer Account', () => {
  test('/account redirects to login when unauthenticated', async ({ page }) => {
    const response = await page.goto('/account');
    expect(response?.status()).toBe(200);
    const url = page.url();
    expect(url).toMatch(/login|auth/);
  });

  test('account page structure', async ({ page }) => {
    await page.goto('/account');
    await expect(page.locator('main')).toBeVisible();
  });
});
