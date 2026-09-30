// Claude records its own screen B-roll: Playwright recordVideo (WebM) + a click log for auto-zoom
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
const url = process.argv[2], outDir = process.argv[3] || "broll";
const browser = await chromium.launch();                 // uses PLAYWRIGHT_BROWSERS_PATH
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } } });
const page = await ctx.newPage(); const t0 = Date.now(); const clicks = [];
async function click(sel) {                               // log timestamp + box => zoom targets for the EDL
  await page.locator(sel).scrollIntoViewIfNeeded();
  const b = await page.locator(sel).boundingBox();
  clicks.push({ t: (Date.now() - t0) / 1000, sel, x: b.x + b.width / 2, y: b.y + b.height / 2 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 15 }); await page.click(sel);
}
await page.goto(url); await page.waitForTimeout(800);
await click("#go"); await page.waitForTimeout(600);
await page.mouse.wheel(0, 500); await page.waitForTimeout(900);
await click("#c1"); await page.waitForTimeout(700);
const video = page.video(); await ctx.close(); await browser.close();
writeFileSync(`${outDir}/clicks.json`, JSON.stringify({ video: await video.path(), clicks }, null, 1));
console.log(await video.path(), clicks.length, "clicks");
