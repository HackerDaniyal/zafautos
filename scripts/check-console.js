const { chromium } = require('playwright-core');

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(5000);

  // Scroll through the page
  await page.evaluate(async () => {
    const delay = ms => new Promise(r => setTimeout(r, ms));
    for (let i = 0; i < document.body.scrollHeight; i += 500) {
      window.scrollTo(0, i);
      await delay(100);
    }
  });
  await page.waitForTimeout(2000);

  await context.close();
  await browser.close();

  console.log('=== Console Errors ===');
  if (errors.length === 0) {
    console.log('None');
  } else {
    errors.forEach(e => console.log(`  ERROR: ${e}`));
  }

  console.log('\n=== Console Warnings ===');
  if (warnings.length === 0) {
    console.log('None');
  } else {
    warnings.forEach(w => console.log(`  WARN: ${w}`));
  }

  console.log(`\nTotal: ${errors.length} errors, ${warnings.length} warnings`);
}

run().catch(e => { console.error(e); process.exit(1); });
