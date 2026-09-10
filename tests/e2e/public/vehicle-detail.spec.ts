import { test, expect } from '@playwright/test';

test.describe('Vehicle Detail Page', () => {
  test('vehicle detail page loads', async ({ page }) => {
    await page.goto('/vehicles');
    const firstCard = page.locator('a[href*="/vehicles/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    expect(href).toBeTruthy();
    const response = await page.goto(href!);
    expect(response?.status()).toBe(200);
  });

  test('vehicle information is displayed', async ({ page }) => {
    await page.goto('/vehicles');
    const firstCard = page.locator('a[href*="/vehicles/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    await page.goto(href!);
    await expect(page.locator('main')).toBeVisible();
  });

  test('gallery is present', async ({ page }) => {
    await page.goto('/vehicles');
    const firstCard = page.locator('a[href*="/vehicles/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    await page.goto(href!);
    const gallery = page.locator('img, [class*="gallery"], [class*="carousel"], [class*="slider"]');
    await expect(gallery.first()).toBeVisible({ timeout: 15000 });
  });

  test('enquiry form presence', async ({ page }) => {
    await page.goto('/vehicles');
    const firstCard = page.locator('a[href*="/vehicles/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    const href = await firstCard.getAttribute('href');
    await page.goto(href!);
    const enquiry = page.locator('button:has-text("nquir"), button:has-text("ontact"), form, [class*="enquiry"], [class*="inquiry"]');
    await expect(enquiry.first()).toBeVisible({ timeout: 15000 });
  });

  test('404 for missing vehicle', async ({ page }) => {
    const response = await page.goto('/vehicles/non-existent-slug-12345');
    expect(response?.status()).toBe(404);
  });
});
