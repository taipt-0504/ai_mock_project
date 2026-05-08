import { chromium } from "@playwright/test";
import path from "node:path";

const OUT = "/home/phungthetai/projects/ai_projects/ai_mock_project/.momorph/specs/8PJQswPZmU-countdown-prelaunch-page/assets/implementation.png";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1512, height: 1077 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3001/coming-soon", { waitUntil: "networkidle" });
// Give the client-side Countdown a moment to hydrate and tick once.
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT, fullPage: false });
console.log("Saved screenshot to", path.basename(OUT));
await browser.close();
