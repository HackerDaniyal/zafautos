const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', '.screenshots', 'phase6-polish');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  // XL Desktop - 7 cols with sidebar
  let ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } });
  let page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: path.join(DIR, '01-hero.png') });
  console.log('01-hero');
  
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '02-featured-7col.png') });
  console.log('02-featured-7col');
  
  await page.evaluate(() => window.scrollBy(0, 1500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '03-sidebar-transition.png') });
  console.log('03-sidebar-transition');
  
  await page.getByText('BROWSE BY PRICE').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '04-browseby-7col-full.png') });
  console.log('04-browseby-7col-full');
  
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '05-footer.png') });
  console.log('05-footer');
  await ctx.close();

  // Laptop - 5 cols with sidebar
  ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '06-laptop-5col.png') });
  console.log('06-laptop-5col');
  await ctx.close();

  // Tablet - 3 cols no sidebar
  ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, '07-tablet-hero.png') });
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '08-tablet-3col.png') });
  console.log('07-08 tablet');
  await ctx.close();

  // Mobile - 2 cols
  ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, '09-mobile-hero.png') });
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '10-mobile-2col.png') });
  console.log('09-10 mobile');
  await ctx.close();

  // Small phone - 1 col
  ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(DIR, '11-small-phone.png') });
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, '12-small-phone-1col.png') });
  console.log('11-12 small-phone');
  await ctx.close();

  // Other pages - no errors check
  for (const p of [
    { name: 'vehicles', url: 'http://localhost:3000/vehicles' },
    { name: 'compare', url: 'http://localhost:3000/compare' },
    { name: 'wishlist', url: 'http://localhost:3000/wishlist' },
    { name: 'detail', url: 'http://localhost:3000/vehicles/toyota-land-cruiser-prado-2016-1' },
  ]) {
    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const pg = await ctx2.newPage();
    const errors = [];
    pg.on('pageerror', err => errors.push(err.message));
    pg.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await pg.goto(p.url, { waitUntil: 'load', timeout: 30000 });
    await pg.waitForTimeout(3000);
    await pg.screenshot({ path: path.join(DIR, `${p.name}.png`) });
    console.log(`${p.name}: ${errors.length === 0 ? 'OK' : errors.length + ' errors'}`);
    await ctx2.close();
  }

  await browser.close();
  console.log('\nAll screenshots saved to', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
