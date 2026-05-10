import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

/**
 * Prelaunch spec US4 (FR-003) — no nav / auth interactive surface.
 *
 * Run with `SAA_LAUNCH_AT=<future ISO>` so `/coming-soon` renders the
 * prelaunch UI (the gate-active CI cell). The npm script
 * `test:e2e:gate-active` is the canonical entry point (Phase 7 / T034).
 *
 * Invariant under verification:
 *   1. From a fresh load, the first Tab focuses either the body / html
 *      OR the demo-bypass submit button — Phase 16 (2026-05-10) carves
 *      out a single exception for the "Skip pre-launch (demo)" button so
 *      portfolio reviewers can flip past the gate without a rebuild.
 *      Auth + nav controls remain forbidden.
 *   2. The prelaunch <main> contains zero non-metadata <a> elements and
 *      at most one <button> — the demo-bypass submit. Any other button
 *      is a regression of the FR-003 invariant.
 *
 * The prelaunch surface is auth-agnostic, so a single anonymous case is
 * sufficient — the chrome-omission contract is identical for every visitor.
 */
test.describe("Prelaunch gate-active — no nav surface (US4 + Phase 16 demo bypass exception)", () => {
  test("Tab from fresh load focuses only the demo-bypass button (or body — no other in-page control)", async ({
    page,
  }) => {
    await page.goto("/coming-soon");

    await page.keyboard.press("Tab");

    const activeInfo = await page.evaluate(() => ({
      tag: document.activeElement?.tagName ?? "",
      text: document.activeElement?.textContent?.trim() ?? "",
    }));
    // Acceptable terminal states for the first Tab:
    //   - BODY / HTML / "" — no focusable control captured focus.
    //   - BUTTON whose text matches the demo-bypass label — the only
    //     intentional control on the prelaunch surface.
    if (activeInfo.tag === "BUTTON") {
      expect(activeInfo.text).toBe(viCatalog["gate.bypass.alert.button"]);
    } else {
      expect(["BODY", "HTML", ""]).toContain(activeInfo.tag);
    }
  });

  test("Prelaunch <main> contains zero <a> + at most one <button> (the demo-bypass submit)", async ({
    page,
  }) => {
    await page.goto("/coming-soon");

    // why: scope to <main> so Next.js dev-mode chrome (the debug overlay
    // button) does not invalidate the assertion. Production builds do
    // not inject that button, but tests run against `npm run dev`.
    const main = page.locator("main");
    expect(await main.locator('a:not([rel~="canonical"])').count()).toBe(0);
    const buttons = main.locator("button");
    expect(await buttons.count()).toBe(1);
    await expect(buttons.first()).toHaveText(
      viCatalog["gate.bypass.alert.button"],
    );
  });
});
