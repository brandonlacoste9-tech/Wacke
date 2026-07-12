import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT_DIR = path.join(process.cwd(), "scratch", "qa-screenshots");
const BASE = "http://localhost:3000";
const EN_WELCOME = "Welcome to Wacké.live. The dark alley";
const FR_WELCOME = "Bienvenue sur Wacké.live. La ruelle sombre";

async function waitForWelcome(page, text, timeout = 10000) {
  try {
    await page.waitForFunction(
      (needle) => document.body.innerText.includes(needle),
      text,
      { timeout }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
  });
  const page = await context.newPage();

  const results = { en: {}, fr: {} };

  // Homepage
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT_DIR, "01-homepage.png"), fullPage: false });
  results.homepage = "ok";

  // Stream page with Graffiti Chat (Kick embed)
  await page.goto(`${BASE}/stream/odablock`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(500);

  // Force English
  await page.evaluate(() => {
    document.cookie = "wacke_lang=en; path=/";
    localStorage.setItem("wacke_lang", "en");
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);

  const enFound = await waitForWelcome(page, EN_WELCOME, 8000);
  const enText = await page.locator("body").innerText();
  results.en.found = enFound;
  results.en.contains = enText.includes(EN_WELCOME);
  await page.screenshot({ path: path.join(OUT_DIR, "02-stream-en-chat.png"), fullPage: false });

  // Toggle language via header button
  const langBtn = page.locator('button[title*="Français"], button[title*="English"]').first();
  if (await langBtn.count()) {
    await langBtn.click();
    await page.waitForTimeout(2500);
  } else {
    // Fallback: set FR via cookie and reload
    await page.evaluate(() => {
      document.cookie = "wacke_lang=fr; path=/";
      localStorage.setItem("wacke_lang", "fr");
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
  }

  const frFound = await waitForWelcome(page, FR_WELCOME, 8000);
  const frText = await page.locator("body").innerText();
  results.fr.found = frFound;
  results.fr.contains = frText.includes(FR_WELCOME);
  results.fr.stillEnglish = frText.includes(EN_WELCOME);
  await page.screenshot({ path: path.join(OUT_DIR, "03-stream-fr-chat.png"), fullPage: false });

  // Studio page (requires auth - capture what we get)
  await page.goto(`${BASE}/dashboard/studio`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT_DIR, "04-studio.png"), fullPage: false });

  await browser.close();

  console.log(JSON.stringify({ outDir: OUT_DIR, results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});