const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', '.screenshots', 'breakpoints');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const viewports = [
  { name: 'small-phone', width: 375, height: 812, expectedCols: 1 },
  { name: 'mobile',      width: 640, height: 1136, expectedCols: 2 },
  { name: 'tablet',      width: 768, height: 1024, expectedCols: 3 },
  { name: 'laptop',      width: 1024, height: 768, expectedCols: 5 },
  { name: 'desktop',     width: 1280, height: 800, expectedCols: 6 },
  { name: 'xl-desktop',  width: 1536, height: 900, expectedCols: 7 },
];

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  for (const vp of viewports) {
    console.log(`\n=== ${vp.name} (${vp.width}x${vp.height}) — expecting ${vp.expectedCols} cols ===`);
    
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(4000);

    // 1. Hero
    await page.screenshot({ path: path.join(DIR, `${vp.name}-01-hero.png`) });
    console.log(`  ✓ 01-hero`);

    // 2. Featured Vehicles
    const featuredHeader = page.getByText('FEATURED VEHICLES');
    if (await featuredHeader.count() > 0) {
      await featuredHeader.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, `${vp.name}-02-featured.png`) });

      // Count columns by measuring card positions
      const cards = page.locator('article');
      const cardCount = await cards.count();
      if (cardCount > 1) {
        const firstBox = await cards.nth(0).boundingBox();
        const secondBox = await cards.nth(1).boundingBox();
        if (firstBox && secondBox) {
          if (secondBox.y > firstBox.y + 10) {
            console.log(`  Cards are stacked vertically — likely ${1} column visible`);
          } else {
            const cols = Math.round((secondBox.x - firstBox.x + firstBox.width) / firstBox.width);
            console.log(`  Card width: ${Math.round(firstBox.width)}px, Estimated cols: ${cols} (expected: ${vp.expectedCols})`);
          }
        }
      }
      console.log(`  ✓ 02-featured`);
    }

    // 3. Scroll to see more cards + sidebar
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, `${vp.name}-03-scrolled.png`) });
    console.log(`  ✓ 03-scrolled`);

    // 4. Browse by Price (full-width, no sidebar)
    const browseByPrice = page.getByText('BROWSE BY PRICE');
    if (await browseByPrice.count() > 0) {
      await browseByPrice.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(DIR, `${vp.name}-04-browse-by-price.png`) });
      console.log(`  ✓ 04-browse-by-price`);
    }

    // 5. Bottom footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(DIR, `${vp.name}-05-footer.png`) });
    console.log(`  ✓ 05-footer`);

    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots saved to', DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
