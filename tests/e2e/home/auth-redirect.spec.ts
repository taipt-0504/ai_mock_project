import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "../fixtures/db";

/**
 * T017 [US0] — The Homepage at `/` is gated by `auth()`. Anonymous and
 * tampered-cookie requests are redirected to `/login`; authenticated requests
 * land on the Homepage; the gate must not produce an infinite loop with
 * Login's own authenticated-redirect (US2).
 *
 * Covered acceptance scenarios:
 *   1. Anonymous GET `/`              → 307/308 redirect to `/login`.
 *   2. Tampered session cookie       → redirect to `/login`.
 *   3. Authenticated GET `/`         → 200 + Homepage markup (post-OAuth landing).
 *   4. Sign-out then visit `/`       → redirect to `/login`.
 *   5. Authenticated visit to /login → redirect back to `/` (no infinite loop).
 *
 * The `/` route is already gated by `app/page.tsx` (shipped with Login). This
 * spec is the regression guard — failures here mean the gate has been removed
 * or weakened.
 */
test.describe("Homepage auth gate (US0)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  test("scenario 1: anonymous GET '/' returns a redirect to '/login'", async ({
    page,
  }) => {
    const response = await page.request.get("/", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toBe("/login");

    // The pre-redirect body MUST NOT contain Homepage hero copy — i.e. the
    // gate runs BEFORE any Homepage content is streamed.
    const body = await response.text();
    expect(body).not.toContain(viCatalog["home.hero.subtitle"]);
  });

  test("scenario 1b: following the redirect lands the browser on '/login'", async ({
    page,
  }) => {
    await page.goto("/");
    expect(new URL(page.url()).pathname).toBe("/login");
    await expect(page.getByAltText(viCatalog["program.title"])).toBeVisible();
  });

  test("scenario 2: a tampered session cookie is treated as anonymous and redirected", async ({
    page,
    context,
  }) => {
    // No matching Session row in the DB — Auth.js's session lookup returns
    // null and `redirect("/login")` fires.
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: "definitely-not-a-real-session-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    const response = await page.request.get("/", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toBe("/login");
  });

  test("scenario 3: an authenticated visitor lands on '/' (post-OAuth state)", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "home-auth-user-3",
      email: "home-auth-3@example.com",
      sessionToken: "home-auth-session-3",
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/");
    // Hero subtitle is one of the localized strings unique to the Homepage.
    await expect(
      page.getByText(viCatalog["home.hero.subtitle"]).first(),
    ).toBeVisible();
  });

  test("scenario 4: clearing the session cookie ('sign out') and visiting '/' redirects", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "home-auth-user-4",
      email: "home-auth-4@example.com",
      sessionToken: "home-auth-session-4",
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    // Sanity: authenticated visit succeeds.
    const authedResponse = await page.goto("/");
    expect(authedResponse?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/");

    // Sign out by deleting the session cookie + the Session row.
    await context.clearCookies({ name: "authjs.session-token" });
    await clearAuthTables();

    const postSignOutResponse = await page.request.get("/", {
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308]).toContain(postSignOutResponse.status());
    expect(postSignOutResponse.headers()["location"]).toBe("/login");
  });

  test("scenario 5: an authenticated visit to '/login' is redirected to '/' (no infinite loop)", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "home-auth-user-5",
      email: "home-auth-5@example.com",
      sessionToken: "home-auth-session-5",
    });
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    // Inspect the raw response — must be a single 30x to '/' (not back to
    // '/login', and not a 200 with Login markup).
    const loginResponse = await page.request.get("/login", {
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308]).toContain(loginResponse.status());
    expect(loginResponse.headers()["location"]).toBe("/");

    // Following the redirect must land on '/' and render Homepage markup
    // (i.e. the Homepage's own auth gate passes — confirming the round-trip
    // does not bounce back to /login).
    const followed = await page.goto("/login");
    expect(followed?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(
      page.getByText(viCatalog["home.hero.subtitle"]).first(),
    ).toBeVisible();
  });
});
