import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "../fixtures/db";

/**
 * Prelaunch spec US2 (FR-006 / FR-007 / Q-PG4) — global gate redirect.
 *
 * Run with the gate ACTIVE: `SAA_LAUNCH_AT=<future ISO>` in the env that
 * starts the dev server. The npm script `test:e2e:gate-active` is the
 * canonical entry point (Phase 7 / T034). Without the env, the proxy fails
 * closed and these specs still pass — but they are most meaningful with a
 * real future timestamp set.
 *
 * Each shipped route (and every Auth.js path) MUST return a server-side 307
 * to `/coming-soon`. With or without a session cookie — the gate is
 * auth-agnostic.
 */
test.describe("Prelaunch gate-active — every shipped route redirects to /coming-soon", () => {
  const SHIPPED_ROUTES = [
    "/",
    "/login",
    "/awards",
    "/sun-kudos",
    "/profile",
    "/general-rules",
  ] as const;

  const AUTHJS_PATHS = [
    "/api/auth/session",
    "/api/auth/csrf",
    "/api/auth/signin",
    "/api/auth/signout",
    "/api/auth/callback/google",
  ] as const;

  test.describe("anonymous visitor (no session cookie)", () => {
    for (const path of SHIPPED_ROUTES) {
      test(`anon GET ${path} → 307 /coming-soon`, async ({ page }) => {
        const response = await page.request.get(path, { maxRedirects: 0 });
        expect([302, 303, 307, 308]).toContain(response.status());
        expect(response.headers()["location"]).toBe("/coming-soon");

        // Pre-redirect body MUST NOT leak the destination route's content.
        const body = await response.text();
        expect(body).not.toContain(viCatalog["home.hero.subtitle"]);
        expect(body).not.toContain(viCatalog["program.title"]);
      });
    }

    for (const path of AUTHJS_PATHS) {
      test(`Auth.js path ${path} → 307 /coming-soon (Q-PG4)`, async ({ page }) => {
        const response = await page.request.get(path, { maxRedirects: 0 });
        expect([302, 303, 307, 308]).toContain(response.status());
        expect(response.headers()["location"]).toBe("/coming-soon");
      });
    }

    test("/api/notifications/unread-count is gated like any other route", async ({ page }) => {
      const response = await page.request.get("/api/notifications/unread-count", {
        maxRedirects: 0,
      });
      expect([302, 303, 307, 308]).toContain(response.status());
      expect(response.headers()["location"]).toBe("/coming-soon");
    });

    test("/coming-soon itself passes through and renders the prelaunch screen", async ({ page }) => {
      await page.goto("/coming-soon");
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
      // Heading text comes from the prelaunch.heading i18n key. Default
      // locale is vi-VN, so we expect the Vietnamese string.
      await expect(heading).toHaveText(viCatalog["prelaunch.heading"]);
    });

    test("Prelaunch screen has zero <a> elements + only the demo-bypass <button> (US4 + Phase 16 exception)", async ({
      page,
    }) => {
      await page.goto("/coming-soon");
      // why: scope to the prelaunch <main> — Next.js dev mode injects its
      // own debug-overlay <button> at the bottom-right. The US4 invariant
      // is about the prelaunch surface, not platform-injected chrome.
      // Phase 16 (2026-05-10) carves a single exception: the demo-bypass
      // submit button. No <a> at all; exactly one <button>; that button
      // matches the documented bypass copy.
      const main = page.locator("main");
      expect(await main.locator("a").count()).toBe(0);
      const buttons = main.locator("button");
      expect(await buttons.count()).toBe(1);
      await expect(buttons.first()).toHaveText(
        viCatalog["gate.bypass.alert.button"],
      );
    });
  });

  test.describe("authenticated visitor (auth-agnostic — FR-002)", () => {
    test.beforeEach(async () => {
      await clearAuthTables();
    });

    test.afterAll(async () => {
      await clearAuthTables();
      await disconnect();
    });

    test("authenticated user requesting / still 307s to /coming-soon", async ({ page, context }) => {
      const { sessionToken } = await seedAuthenticatedUser({
        email: "gate-active-test@example.com",
      });
      await context.addCookies([
        {
          name: "authjs.session-token",
          value: sessionToken,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ]);

      const response = await page.request.get("/", { maxRedirects: 0 });
      expect([302, 303, 307, 308]).toContain(response.status());
      expect(response.headers()["location"]).toBe("/coming-soon");
    });
  });
});

/**
 * T038 — 360 px viewport smoke (Principle III + Phase 7).
 *
 * Mobile-floor regression: the prelaunch surface MUST not horizontally
 * scroll at the 360 px width floor. A screenshot is captured for manual
 * review on every CI run.
 */
test.describe("Prelaunch gate-active — 360 px viewport smoke (US1 / Principle III)", () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test("/coming-soon at 360 px has no horizontal scrollbar", async ({ page }, testInfo) => {
    await page.goto("/coming-soon");

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows).toBe(false);

    // Capture a screenshot for manual review (attached to the Playwright
    // report so reviewers can eyeball legibility of the tiles).
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach("coming-soon-360px.png", {
      body: screenshot,
      contentType: "image/png",
    });
  });
});
