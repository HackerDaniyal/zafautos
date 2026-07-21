const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', '.screenshots', 'phase6');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  // Desktop XL — 7 cols
  let ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } });
  let page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(DIR, 'xl-hero.png') });
  console.log('xl-hero');

  // Scroll to featured
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'xl-featured.png') });
  console.log('xl-featured');

  // Scroll to show sidebar bottom + BrowseByPrice transition
  await page.evaluate(() => window.scrollBy(0, 2000));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'xl-transition.png') });
  console.log('xl-transition');

  // BrowseByPrice
  await page.getByText('BROWSE BY PRICE').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'xl-browseby.png') });
  console.log('xl-browseby');

  // Bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'xl-bottom.png') });
  console.log('xl-bottom');
  await ctx.close();

  // Tablet — 3 cols
  ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, 'tablet-hero.png') });
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'tablet-featured.png') });
  console.log('tablet');
  await ctx.close();

  // Mobile — 2 cols
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, 'mobile-hero.png') });
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'mobile-featured.png') });
  console.log('mobile');
  await ctx.close();

  await browser.close();
  console.log('Done');
}

run().catch(e => { console.error(e); process.exit(1); });
