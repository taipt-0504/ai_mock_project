#!/usr/bin/env node
/**
 * T074 — Lighthouse audit for /login.
 *
 * Boots Chrome via chrome-launcher, runs Lighthouse against
 * http://localhost:3000/login (a dev server must already be running),
 * writes the JSON report to docs/lighthouse-login.json, and asserts the
 * accessibility score is ≥95 per SC-005.
 *
 * Usage (after `npm run dev` is up):
 *   node scripts/lighthouse-login.mjs
 *
 * Pass `--no-fail` to capture the report without failing on threshold.
 */
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const URL = process.env.LIGHTHOUSE_URL ?? "http://localhost:3000/login";
const OUTPUT = "docs/lighthouse-login.json";
const A11Y_MIN = 0.95;
const failOnThreshold = !process.argv.includes("--no-fail");

/** Locate a chromium binary — prefer Playwright's bundled one, fall back to system Chrome. */
function findChromiumBinary() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const playwrightDir = join(homedir(), ".cache", "ms-playwright");
  if (existsSync(playwrightDir)) {
    const candidate = readdirSync(playwrightDir)
      .filter((d) => d.startsWith("chromium-"))
      .map((d) => join(playwrightDir, d, "chrome-linux64", "chrome"))
      .find((p) => existsSync(p));
    if (candidate) return candidate;
  }
  return undefined; // chrome-launcher will autodetect system Chrome
}

const chromePath = findChromiumBinary();
const chrome = await chromeLauncher.launch({
  chromePath,
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});

try {
  const result = await lighthouse(URL, {
    port: chrome.port,
    output: "json",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    logLevel: "error",
  });

  if (!result) throw new Error("lighthouse returned no result");

  const lhr = result.lhr;
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(lhr, null, 2));

  const scores = Object.fromEntries(
    Object.entries(lhr.categories).map(([key, cat]) => [key, cat.score]),
  );
  console.log("\n=== Lighthouse — /login ===");
  for (const [k, v] of Object.entries(scores)) {
    console.log(`  ${k.padEnd(15)} ${v == null ? "n/a" : Math.round(v * 100)}`);
  }
  console.log(`  → report saved to ${OUTPUT}\n`);

  const a11y = scores.accessibility;
  if (failOnThreshold && (a11y == null || a11y < A11Y_MIN)) {
    console.error(
      `Accessibility score ${a11y == null ? "n/a" : Math.round(a11y * 100)} is below the required minimum ${Math.round(A11Y_MIN * 100)} (SC-005).`,
    );
    process.exit(1);
  }
} finally {
  await chrome.kill();
}
