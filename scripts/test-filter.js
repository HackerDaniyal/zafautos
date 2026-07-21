const { chromium } = require('playwright-core');
const path = require('path');
const DIR = path.join('E:\\VIP Data\\PROJECTs\\ZafAutos\\.screenshots', 'final-freeze');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Scroll to sidebar
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);
  
  // Click Toyota filter
  const toyotaBtn = page.locator('button:has-text("TOYOTA")');
  await toyotaBtn.click();
  await page.waitForTimeout(1500);
  
  // Screenshot after filtering - scroll to top to see grid
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '16-filter-toyota.png') });
  console.log('Toyota filter captured');

  // Check error count on page
  const errors = [];
  page.on('response', resp => { if (resp.status() >= 400) errors.push('HTTP ' + resp.status()); });
  page.on('pageerror', err => errors.push('JS: ' + err.message));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Errors after filter: ' + (errors.length === 0 ? '0' : errors.length));
  
  await browser.close();
})();
