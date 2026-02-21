const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const base = process.env.BASE_URL || 'http://localhost:3003/';
  console.log('Opening', base);
  await page.goto(base, { waitUntil: 'networkidle2' });

  // Click admin lock in footer
  await page.waitForSelector('button[title="Admin Login"]', { visible: true });
  console.log('Clicking Admin Login');
  await page.click('button[title="Admin Login"]');

  // Wait for admin table and click first edit button
  await page.waitForSelector('table tbody tr', { visible: true });
  console.log('Admin table visible, opening first post editor');
  await page.evaluate(() => {
    const btn = document.querySelector('table tbody tr button');
    if (btn) (btn as HTMLElement).click();
  });

  // Wait for PostEditor to mount
  await page.waitForSelector('div.fixed.inset-0', { visible: true });
  console.log('PostEditor opened');

  // Click first block wrapper to select it
  await page.waitForSelector('div.pb-20 .group', { visible: true });
  await page.click('div.pb-20 .group');
  console.log('Clicked first block wrapper');

  // Wait for contentEditable to appear and type
  await page.waitForSelector('[contenteditable="true"]', { visible: true });
  const el = await page.$('[contenteditable="true"]');
  if (!el) throw new Error('No contenteditable element found');
  await el.focus();
  await page.keyboard.type(' — automated edit');
  console.log('Typed into contenteditable');

  // Log updated innerHTML
  const updated = await page.evaluate((node) => (node as HTMLElement).innerHTML, el);
  console.log('Updated content:', updated.slice(0, 200));

  // Click Save button (text contains 'Speichern')
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent && b.textContent.trim().includes('Speichern'));
    if (btn) (btn as HTMLElement).click();
  });
  console.log('Clicked Save');

  await page.waitForTimeout(1500);
  await browser.close();
  console.log('Smoke test finished successfully');
  process.exit(0);
})().catch(err => {
  console.error('Smoke test failed', err);
  process.exit(1);
});
