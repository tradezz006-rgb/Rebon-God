import { chromium } from "playwright";

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.on("pageerror", (e) => errors.push(`PAGE: ${e.message}\n${e.stack}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`);
});

await page.goto("http://localhost:8080/lesson/PM-0.1", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

// Wait through whiteboard + first console segment
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(5000);
  const snap = await page.evaluate(() => ({
    phase: document.body.innerText.includes("Framing")
      ? "whiteboard"
      : document.body.innerText.includes("Ren teaching")
        ? "running"
        : "other",
    hasConsole: !!document.querySelector(".aws-console-root"),
    consoleH: document.querySelector(".aws-console-root")?.getBoundingClientRect().height ?? 0,
    ec2: !!document.querySelector('[class*="awsui_table"]'),
    bg: getComputedStyle(document.querySelector(".fixed.inset-0") || document.body).backgroundColor,
  }));
  console.log(`t=${(i + 1) * 5}s`, JSON.stringify(snap));
}

console.log("\n=== ERRORS ===");
console.log(errors.join("\n---\n") || "(none)");

await browser.close();
