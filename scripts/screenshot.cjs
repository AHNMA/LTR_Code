const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const outDir = './screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const sizes = [
    { name: 'mobile', width: 375, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1366, height: 768 }
  ];

  for (const s of sizes) {
    console.log('Capturing', s.name);
    await page.setViewport({ width: s.width, height: s.height });

    // Open homepage
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle2' });
    // Give app some time to render interactive components
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/home-${s.name}.png`, fullPage: false });

    // Click first visible article card within the main container (more robust)
    try {
      // Wait until either cards exist or the feed header appears - handle DB seeding / app init delays
      await page.waitForFunction(() => {
        try {
          const cards = document.querySelectorAll('.container .bg-f1-card');
          if (cards && cards.length > 0) return true;
          return document.body && document.body.innerText && document.body.innerText.includes('Aktueller News Feed');
        } catch (e) { return false; }
      }, { timeout: 30000 });

      const clicked = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.container .bg-f1-card'));
        for (const el of cards) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 10 && rect.height > 10) {
            el.click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) throw new Error('no visible article card found');

      // Wait for article view to render and article body to be present
      await page.waitForSelector('article.bg-f1-dark .article-body', { timeout: 15000 });
      // Extra render pause for heavy images/fonts
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${outDir}/article-${s.name}.png`, fullPage: false });
    } catch (e) {
      console.warn('Could not capture article for', s.name, e.message);
    }
  }

  await browser.close();
  console.log('Screenshots saved to', outDir);
})();
