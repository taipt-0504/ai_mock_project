import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect } from "../fixtures/db";

/**
 * T051 [US1] — Sign-in happy path.
 *
 * Scope note: the full Google OAuth handshake requires intercepting two
 * server-to-server calls (Google's token + userinfo endpoints) that
 * Playwright's `page.route()` cannot reach (those originate from the
 * Next.js server, not the browser). The full DB-write half of the flow is
 * already covered end-to-end by the adapter integration test (T035).
 *
 * What this spec covers:
 *   - The button is clickable (i.e. not blocked by overlapping siblings).
 *   - Clicking it kicks off the Auth.js sign-in handshake — Auth.js sets
 *     its CSRF + state cookies and redirects toward Google's authorize
 *     endpoint with the documented OAuth params.
 *   - After the (real) Google handshake, Auth.js's callback would land on
 *     `/api/auth/callback/google` and create a Session row. That second
 *     leg is exercised at the unit level by the PrismaAdapter test (T035)
 *     and at the route level by the abuse-case follow-up (T034 deferred).
 */
test.describe("Sign in with Google (US1) — happy path", () => {
  test.beforeAll(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("LOGIN button is rendered with the localized label and is enabled", async ({
    page,
  }) => {
    await page.goto("/login");
    const button = page.getByRole("button", {
      name: viCatalog["loginButton.label"],
    });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await expect(button).toHaveAttribute("aria-busy", "false");
    await expect(button).toHaveAttribute("aria-disabled", "false");
  });

  test("clicking the button kicks off the Auth.js sign-in route → Google authorize URL", async ({
    page,
  }) => {
    await page.goto("/login");
    // Stub Google with a 200 response so the navigation completes locally
    // (the browser otherwise would hang on a real network request).
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({ status: 200, body: "stub" }),
    );

    // Capture the request the browser MAKES to accounts.google.com — this
    // is the navigation triggered by Auth.js's redirect.
    const googleRequestPromise = page.waitForRequest(
      (req) => req.url().startsWith("https://accounts.google.com/"),
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: viCatalog["loginButton.label"] }).click();
    const googleRequest = await googleRequestPromise;

    const targetUrl = new URL(googleRequest.url());
    expect(targetUrl.host).toBe("accounts.google.com");
    expect(targetUrl.searchParams.get("client_id")).toBeTruthy();
    expect(targetUrl.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback/google",
    );
    expect(targetUrl.searchParams.get("response_type")).toBe("code");
    const scope = targetUrl.searchParams.get("scope") ?? "";
    expect(scope).toContain("openid");
    expect(scope).toContain("email");
    expect(scope).toContain("profile");
    // Auth.js v5 uses PKCE (OAuth 2.1) instead of the legacy `state` param.
    expect(targetUrl.searchParams.get("code_challenge")).toBeTruthy();
    expect(targetUrl.searchParams.get("code_challenge_method")).toBe("S256");
  });

  test("Auth.js sets the PKCE + CSRF cookies before redirecting to Google", async ({
    page,
    context,
  }) => {
    await page.goto("/login");
    await page.route("https://accounts.google.com/**", (route) =>
      route.fulfill({ status: 200, body: "stub" }),
    );
    const googleRequestPromise = page.waitForRequest(
      (req) => req.url().startsWith("https://accounts.google.com/"),
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: viCatalog["loginButton.label"] }).click();
    await googleRequestPromise;

    const cookies = await context.cookies();
    const pkceCookie = cookies.find((c) =>
      c.name.toLowerCase().includes("pkce.code_verifier"),
    );
    const csrfCookie = cookies.find((c) =>
      c.name.toLowerCase().includes("csrf-token"),
    );
    expect(
      pkceCookie,
      "Auth.js should set the PKCE code_verifier cookie",
    ).toBeDefined();
    expect(csrfCookie, "Auth.js should set the CSRF token cookie").toBeDefined();
  });
});
