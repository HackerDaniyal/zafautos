const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', '.screenshots', 'phase6-final');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const pages = [
    { name: 'homepage', url: 'http://localhost:3000', width: 1536, height: 900 },
    { name: 'vehicles', url: 'http://localhost:3000/vehicles', width: 1280, height: 800 },
    { name: 'compare', url: 'http://localhost:3000/compare', width: 1280, height: 800 },
    { name: 'wishlist', url: 'http://localhost:3000/wishlist', width: 1280, height: 800 },
  ];

  for (const p of pages) {
    const ctx = await browser.newContext({ viewport: { width: p.width, height: p.height } });
    const page = await ctx.newPage();
    
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

    await page.goto(p.url, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(DIR, `${p.name}-above-fold.png`) });
    
    // Scroll through the page
    await page.evaluate(async () => {
      const delay = ms => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < Math.min(document.body.scrollHeight, 5000); i += 500) {
        window.scrollTo(0, i);
        await delay(100);
      }
    });
    await page.waitForTimeout(500);

    if (errors.length > 0) {
      console.log(`  ⚠ ${p.name}: ${errors.length} errors: ${errors[0]}`);
    } else {
      console.log(`✓ ${p.name}`);
    }
    await ctx.close();
  }

  // Homepage detail screenshots
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(4000);

  // Featured
  await page.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'homepage-featured.png') });
  console.log('✓ homepage-featured');

  // Browse By Price (full-width transition)
  await page.getByText('BROWSE BY PRICE').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'homepage-browseby.png') });
  console.log('✓ homepage-browseby');

  // Bottom
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(DIR, 'homepage-bottom.png') });
  console.log('✓ homepage-bottom');

  await ctx.close();

  // Tablet + Mobile
  for (const vp of [
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const ctx2 = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page2 = await ctx2.newPage();
    await page2.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
    await page2.waitForTimeout(3000);
    await page2.screenshot({ path: path.join(DIR, `homepage-${vp.name}.png`) });
    await page2.getByText('FEATURED VEHICLES').first().scrollIntoViewIfNeeded();
    await page2.waitForTimeout(500);
    await page2.screenshot({ path: path.join(DIR, `homepage-${vp.name}-featured.png`) });
    console.log(`✓ ${vp.name}`);
    await ctx2.close();
  }

  await browser.close();
  console.log('\nDone');
}

run().catch(e => { console.error(e); process.exit(1); });
