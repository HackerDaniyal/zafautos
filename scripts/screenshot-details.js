const { chromium } = require('playwright-core');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', '.screenshots');

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Screenshot the sidebar area (sticky behavior check)
  const sidebarArea = await page.locator('aside').first();
  if (await sidebarArea.isVisible()) {
    const box = await sidebarArea.boundingBox();
    if (box) {
      await page.screenshot({ 
        path: path.join(SCREENSHOT_DIR, 'sidebar-area.png'),
        clip: { x: 0, y: box.y - 50, width: 500, height: 900 }
      });
      console.log('✓ sidebar area');
    }
  }

  // Scroll to "Browse by Price" section to verify sidebar stops
  const browseByPrice = await page.getByText('Browse by Price').first();
  if (browseByPrice) {
    await browseByPrice.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'browse-by-price.png') });
    console.log('✓ browse by price section');
  }

  // Scroll to WhyChooseUs
  const whyChooseUs = await page.getByText('Why Choose Us').first();
  if (whyChooseUs) {
    await whyChooseUs.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'why-choose-us.png') });
    console.log('✓ why choose us');
  }

  // Scroll to bottom (CTA + Footer)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'bottom-footer.png') });
  console.log('✓ bottom footer');

  // Scroll to middle to see "Recently Added" section transition
  const recentlyAdded = await page.getByText('Recently Added').first();
  if (recentlyAdded) {
    await recentlyAdded.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'recently-added.png') });
    console.log('✓ recently added');
  }

  await context.close();
  await browser.close();
  console.log('\nDone');
}

run().catch(e => { console.error(e); process.exit(1); });
