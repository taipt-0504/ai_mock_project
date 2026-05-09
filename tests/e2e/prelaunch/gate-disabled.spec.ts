import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "../fixtures/db";

/**
 * Prelaunch spec US3 (FR-008) — gate is LIFTED.
 *
 * Run with `SAA_LAUNCH_AT=<past ISO>` in the env that starts the dev server.
 * The npm script `test:e2e:gate-disabled` is the canonical entry point
 * (Phase 7 / T034). With the gate lifted:
 *   - `/coming-soon` 307s to `/`.
 *   - Anonymous follow lands on `/login` (Homepage US0).
 *   - Authenticated follow lands on the Homepage.
 *   - Other shipped routes resume their normal handlers (no proxy redirect).
 */
test.describe("Prelaunch gate-disabled — /coming-soon is unreachable", () => {
  test.describe("anonymous visitor", () => {
    test("GET /coming-soon → 307 with Location: / (no redirects followed)", async ({ page }) => {
      const response = await page.request.get("/coming-soon", { maxRedirects: 0 });
      expect([302, 303, 307, 308]).toContain(response.status());
      expect(response.headers()["location"]).toBe("/");

      // No prelaunch markup leaks pre-redirect.
      const body = await response.text();
      expect(body).not.toContain(viCatalog["prelaunch.heading"]);
    });

    test("anonymous full chain /coming-soon → / → /login", async ({ page }) => {
      await page.goto("/coming-soon");
      // Homepage US0 redirects anon → /login.
      expect(new URL(page.url()).pathname).toBe("/login");
      // Login surface is reachable post-gate.
      await expect(page.getByAltText(viCatalog["program.title"])).toBeVisible();
    });

    test("GET /login responds normally (no proxy redirect)", async ({ page }) => {
      const response = await page.request.get("/login", { maxRedirects: 0 });
      // Anonymous → Login renders 200; proxy MUST NOT intervene.
      expect(response.status()).toBe(200);
    });

    test("GET /awards responds normally (no proxy redirect)", async ({ page }) => {
      const response = await page.request.get("/awards", { maxRedirects: 0 });
      // /awards is gated by its own auth() check (anon → /login), NOT by
      // the prelaunch proxy. A 30x with Location:/login is the normal
      // post-gate behavior; what matters is that we are NOT redirected
      // to /coming-soon.
      const location = response.headers()["location"] ?? "";
      expect(location).not.toBe("/coming-soon");
    });

    test("GET / does NOT redirect to /coming-soon", async ({ page }) => {
      const response = await page.request.get("/", { maxRedirects: 0 });
      const location = response.headers()["location"] ?? "";
      expect(location).not.toBe("/coming-soon");
    });
  });

  test.describe("authenticated visitor", () => {
    test.beforeEach(async () => {
      await clearAuthTables();
    });

    test.afterAll(async () => {
      await clearAuthTables();
      await disconnect();
    });

    test("authenticated /coming-soon → / → Homepage 200", async ({ page, context }) => {
      const { sessionToken } = await seedAuthenticatedUser({
        userId: "gate-disabled-user-1",
        email: "gate-disabled-1@example.com",
        sessionToken: "gate-disabled-session-1",
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

      // Raw response: single 30x to '/'.
      const initial = await page.request.get("/coming-soon", { maxRedirects: 0 });
      expect([302, 303, 307, 308]).toContain(initial.status());
      expect(initial.headers()["location"]).toBe("/");

      // Following the redirect lands on the Homepage (Homepage US0 lets
      // the authenticated session through).
      const followed = await page.goto("/coming-soon");
      expect(followed?.status()).toBe(200);
      expect(new URL(page.url()).pathname).toBe("/");
      await expect(
        page.getByText(viCatalog["home.hero.subtitle"]).first(),
      ).toBeVisible();
    });
  });
});
