import { expect, test } from "@playwright/test";

/**
 * Prelaunch spec US4 (FR-003) — no interactive surface.
 *
 * Run with `SAA_LAUNCH_AT=<future ISO>` so `/coming-soon` renders the
 * prelaunch UI (the gate-active CI cell). The npm script
 * `test:e2e:gate-active` is the canonical entry point (Phase 7 / T034).
 *
 * Invariant under verification:
 *   1. From a fresh load, the first Tab MUST land on the body / html
 *      (no in-page focusable control).
 *   2. The prelaunch <main> contains zero <button> and zero non-metadata
 *      <a> elements.
 *
 * The prelaunch surface is auth-agnostic, so a single anonymous case is
 * sufficient — the chrome-omission contract is identical for every visitor.
 */
test.describe("Prelaunch gate-active — no interactive surface (US4)", () => {
  test("Tab from fresh load focuses no in-page control", async ({ page }) => {
    await page.goto("/coming-soon");

    await page.keyboard.press("Tab");

    const activeTag = await page.evaluate(
      () => document.activeElement?.tagName ?? "",
    );
    // why: a fresh page with zero focusable controls leaves focus on
    // <body> (some browsers report <html>). Either is acceptable —
    // both indicate no prelaunch-owned control captured focus.
    expect(["BODY", "HTML", ""]).toContain(activeTag);
  });

  test("Prelaunch <main> contains zero <button> and zero <a> (excluding canonical metadata)", async ({
    page,
  }) => {
    await page.goto("/coming-soon");

    // why: scope to <main> so Next.js dev-mode chrome (the debug overlay
    // button) does not invalidate the assertion. Production builds do
    // not inject that button, but tests run against `npm run dev`.
    const main = page.locator("main");
    expect(await main.locator("button").count()).toBe(0);
    expect(await main.locator('a:not([rel~="canonical"])').count()).toBe(0);
  });
});
