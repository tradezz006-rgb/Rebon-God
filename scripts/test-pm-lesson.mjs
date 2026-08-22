import { chromium } from "playwright";

const url = "http://localhost:8080/lesson/PM-0.1";
const errors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("pageerror", (err) => errors.push(`PAGE: ${err.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
});

console.log("Opening", url);
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

// Wait through whiteboard + segment 1 steps (~45s)
for (let i = 0; i < 45; i++) {
  await page.waitForTimeout(1000);
  const crash = await page.locator("text=Lesson hit a render error").count();
  if (crash > 0) {
    console.log("CRASH detected at second", i + 1);
    break;
  }
}

const crashText = await page.locator("text=Lesson hit a render error").count();
const subtitle = await page.locator("text=Look at the instances").count();
const emptyTarget = await page.locator('[data-console-target="ec2-instances-empty"]').count();

console.log("Crash UI visible:", crashText > 0);
console.log("Empty state target in DOM:", emptyTarget > 0);
console.log("Errors captured:", errors.length);
errors.slice(0, 10).forEach((e) => console.log(" ", e));

await page.screenshot({ path: "scripts/pm-lesson-test.png", fullPage: true });
await browser.close();

process.exit(crashText > 0 ? 1 : 0);
