import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test('/admin redirects to login when unauthenticated', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(200);
    const url = page.url();
    expect(url).toMatch(/login|auth/);
  });
});
