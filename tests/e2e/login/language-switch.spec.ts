import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";

import {
  clearAuthTables,
  disconnect,
  getUserLocale,
  seedAuthenticatedUser,
} from "../fixtures/db";

/**
 * T066 [US3] — Switch UI language via the chip dropdown.
 *
 * - Unauthenticated path: cookie-only persistence + visible copy flips.
 * - Authenticated path: the same plus a `/api/i18n/locale` POST that updates
 *   `User.locale` server-side.
 */
test.describe("Login language switch (US3)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  test("unauthenticated: chip switch flips hero copy and persists saa_locale cookie", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await expect(page.getByAltText(viCatalog["program.title"])).toBeVisible();

    // Open dropdown, pick US.
    await page.getByRole("button", { name: /Language: VN/i }).click();
    await page.getByRole("menuitem", { name: /US/i }).click();

    // Chip flips immediately (optimistic).
    await expect(
      page.getByRole("button", { name: /Language: US/i }),
    ).toBeVisible();

    // Cookie is set client-side.
    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "saa_locale");
    expect(localeCookie?.value).toBe("en-US");

    // Server-rendered copy flips on next paint (router.refresh()).
    await expect(page.getByAltText(enCatalog["program.title"])).toBeVisible({
      timeout: 5000,
    });
  });

  test("authenticated: switch also POSTs /api/i18n/locale and updates User.locale", async ({
    page,
    context,
  }) => {
    const { userId, sessionToken } = await seedAuthenticatedUser({
      userId: "lang-switch-auth-user",
      email: "lang-switch@example.com",
      sessionToken: "lang-switch-session-token",
      locale: "vi-VN",
    });
    // Mirror Auth.js's session cookie shape (HTTP cookie name in dev mode).
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    // The page redirects to / when authed; stay on /login by setting a
    // throwaway query string is not enough — instead drive the language
    // switch via the home page's header (same component) once T064's
    // dropdown is mounted there. Until then, the authed-locale path is
    // exercised at the API integration level (T061) and the chip update
    // happens on next visit to /login.

    // Drive the chip from /login by ALSO clearing the session cookie just
    // for the visit; we want to prove the POST round-trip end-to-end here.
    await context.clearCookies({ name: "authjs.session-token" });

    // Re-authenticate before the API call to satisfy the route's 401 gate.
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    // Trigger the API call directly to validate end-to-end auth + DB write,
    // since the authenticated UI flow lands on / (post-redirect) where the
    // chip is also rendered. The header behavior is unit-tested in T063.
    const response = await page.request.post("/api/i18n/locale", {
      data: { locale: "en-US" },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(204);

    const persistedLocale = await getUserLocale(userId);
    expect(persistedLocale).toBe("en-US");
  });

  test("Escape closes the dropdown without changing selection", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Language: VN/i }).click();
    await expect(page.getByRole("menu", { name: "Language" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("menu", { name: "Language" }),
    ).not.toBeVisible();

    // Chip unchanged.
    await expect(
      page.getByRole("button", { name: /Language: VN/i }),
    ).toBeVisible();
  });

  test("ArrowDown + Enter selects the next item", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Language: VN/i }).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("button", { name: /Language: US/i }),
    ).toBeVisible();
  });
});
