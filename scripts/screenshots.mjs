import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(__dirname, '..', 'assets');
const FRONTEND_URL = 'https://stock-flow-ashen.vercel.app';
const VIEWPORT = { width: 1440, height: 900 };

mkdirSync(ASSETS_DIR, { recursive: true });

async function screenshot(page, name, selector) {
  const path = resolve(ASSETS_DIR, `${name}.png`);
  if (selector) {
    const el = await page.$(selector);
    if (el) await el.screenshot({ path });
    else await page.screenshot({ path, fullPage: true });
  } else {
    await page.screenshot({ path, fullPage: true });
  }
  console.log(`✅ Captured: ${name}.png`);
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: VIEWPORT,
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ── 1. Login ──
    console.log('🔐 Navigating to login...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await sleep(2000);

    // Fill login form
    const usernameInput = await page.$('input[type="text"]');
    if (usernameInput) {
      await usernameInput.type('demo', { delay: 30 });
    }
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.type('demo123', { delay: 30 });
    }
    await sleep(500);

    // Click Sign In button
    const signInBtn = await page.$('button[type="submit"]');
    if (signInBtn) {
      await signInBtn.click();
    }
    await sleep(3000);
    await page.waitForSelector('.content-area', { timeout: 10000 }).catch(() => {});
    await sleep(2000);
    console.log('✅ Logged in successfully');

    // ── 2. Dashboard / Market Overview ──
    console.log('📊 Capturing Market Overview...');
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle0' });
    await sleep(3000);
    await screenshot(page, 'dashboard');

    // ── 3. Stock List ──
    console.log('📋 Capturing Stock List...');
    const stocksBtn = await page.evaluateHandle(() => {
      const items = document.querySelectorAll('.nav-item');
      for (const item of items) {
        if (item.textContent?.includes('All Stocks')) return item;
      }
      return null;
    });
    if (stocksBtn) await stocksBtn.click();
    await sleep(2000);
    await screenshot(page, 'stocks');

    // ── 4. Stock Detail ──
    console.log('📈 Capturing Stock Detail...');
    const firstRow = await page.$('.stock-row');
    if (firstRow) await firstRow.click();
    await sleep(3000);
    await screenshot(page, 'stock-detail');

    // ── 5. Portfolio ──
    console.log('💼 Capturing Portfolio...');
    const portfolioBtn = await page.evaluateHandle(() => {
      const items = document.querySelectorAll('.nav-item');
      for (const item of items) {
        if (item.textContent?.includes('Portfolio')) return item;
      }
      return null;
    });
    if (portfolioBtn) await portfolioBtn.click();
    await sleep(3000);
    await screenshot(page, 'portfolio');

    // ── 6. Compare View ──
    console.log('📊 Capturing Compare View...');
    const compareBtn = await page.evaluateHandle(() => {
      const items = document.querySelectorAll('.nav-item');
      for (const item of items) {
        if (item.textContent?.includes('Compare')) return item;
      }
      return null;
    });
    if (compareBtn) await compareBtn.click();
    await sleep(2000);
    await screenshot(page, 'compare');

    // ── 7. News Feed ──
    console.log('📰 Capturing News Feed...');
    const newsBtn = await page.evaluateHandle(() => {
      const items = document.querySelectorAll('.nav-item');
      for (const item of items) {
        if (item.textContent?.includes('News')) return item;
      }
      return null;
    });
    if (newsBtn) await newsBtn.click();
    await sleep(2000);
    await screenshot(page, 'news');

    console.log('\n🎉 All screenshots captured successfully!');
    console.log(`📁 Saved to: ${ASSETS_DIR}`);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
