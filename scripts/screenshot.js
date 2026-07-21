const { chromium } = require('playwright-core');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', '.screenshots');

async function run() {
  const fs = require('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const viewports = [
    { name: 'desktop-xl', width: 1920, height: 1080 },
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'laptop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Full page screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-full.png`), fullPage: true });
    console.log(`✓ ${vp.name} full page`);
    
    // Above the fold
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-hero.png`) });
    console.log(`✓ ${vp.name} hero`);
    
    // Scroll to featured vehicles
    await page.evaluate(() => {
      const el = document.querySelector('h2');
      if (el) el.scrollIntoView({ block: 'start' });
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-featured.png`) });
    console.log(`✓ ${vp.name} featured`);
    
    await context.close();
  }

  await browser.close();
  console.log('\nAll screenshots saved to', SCREENSHOT_DIR);
}

run().catch(e => { console.error(e); process.exit(1); });
