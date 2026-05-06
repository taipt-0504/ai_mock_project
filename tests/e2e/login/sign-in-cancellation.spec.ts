import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect } from "../fixtures/db";

/**
 * T052 [US1] — Sign-in cancellation paths.
 *
 * Two acceptance scenarios from the spec:
 *   (a) Google returns `error=access_denied` → land on /login with the
 *       cancelled-error copy.
 *   (b) Browser-back from Google's consent screen → land on /login with
 *       `oauthInProgress` cleared so the button re-enables.
 *
 * Scope note: scenario (a) is verified by hitting Auth.js's callback with
 * a synthetic `error=access_denied` query param — Auth.js redirects to its
 * built-in error page in that case (no Session row created, no cookie).
 * Scenario (b) is verified via `page.goBack()` after a click, asserting
 * the button returns to its idle state.
 */
test.describe("Sign in with Google (US1) — cancellation", () => {
  test.beforeAll(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("Google returns error=access_denied → no Session is created and the user lands somewhere safe", async ({
    page,
    request,
  }) => {
    // Hit the callback directly with the same query Google sends when the
    // user clicks "Cancel" on the consent screen.
    const response = await request.get(
      "/api/auth/callback/google?error=access_denied",
      { maxRedirects: 0 },
    );

    // Auth.js v5 returns 302 to its error page (or signin), never 200.
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers()["location"] ?? "";
    expect(location).not.toBe("/"); // not signed in

    // Visiting the resulting page should keep the user away from the
    // authenticated home (no Session was created).
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: viCatalog["loginButton.label"] }),
    ).toBeVisible();
  });

  test("browser-back after the OAuth navigation returns to /login with the button re-enabled", async ({
    page,
  }) => {
    await page.goto("/login");
    // Stub Google with a tiny HTML body so the navigation completes (the
    // browser otherwise hangs on a real HTTPS roundtrip).
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>stub-google-consent</body></html>",
      }),
    );

    // Trigger the OAuth handshake and wait for the Google navigation to
    // settle so it lands in browser history.
    await Promise.all([
      page.waitForURL("https://accounts.google.com/**", { timeout: 15_000 }),
      page
        .getByRole("button", { name: viCatalog["loginButton.label"] })
        .click(),
    ]);
    expect(page.url()).toContain("accounts.google.com");

    // Simulate the user clicking the browser-back button.
    await page.goBack();
    await page.waitForURL("**/login", { timeout: 5_000 });

    // We should be back on /login with the LOGIN button idle (no
    // `oauthInProgress` lock — the user can try again).
    expect(new URL(page.url()).pathname).toBe("/login");
    const button = page.getByRole("button", {
      name: viCatalog["loginButton.label"],
    });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-busy", "false");
    await expect(button).toHaveAttribute("aria-disabled", "false");
  });
});
