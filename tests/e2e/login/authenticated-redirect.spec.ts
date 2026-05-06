import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "../fixtures/db";

/**
 * T056 [US2] — An already-authenticated visitor hitting `/login` is
 * redirected to `/` server-side BEFORE any Login markup is sent.
 *
 * SC-002: zero "Login flicker" — the response body must never contain hero
 * markup when a valid session is presented.
 */
test.describe("Authenticated visitor redirect (US2)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  test("redirects to '/' and never serves Login markup when a session cookie is presented", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "redirect-test-user",
      email: "redirect-e2e@example.com",
      sessionToken: "redirect-session-token",
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

    // Inspect the raw response BEFORE following the redirect — it must be
    // a 30x with the Login hero text absent from the body.
    const response = await page.request.get("/login", {
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308]).toContain(response.status());
    const location = response.headers()["location"];
    expect(location).toBe("/");

    const body = await response.text();
    expect(body).not.toContain(viCatalog["program.title"]);
    expect(body).not.toContain(viCatalog["loginButton.label"]);
  });

  test("after the redirect, navigating to /login lands the browser on '/'", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "redirect-test-user-2",
      email: "redirect-e2e-2@example.com",
      sessionToken: "redirect-session-token-2",
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

    const navResponse = await page.goto("/login");
    expect(navResponse?.status()).toBe(200); // final response, after redirect
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("an unauthenticated visitor stays on /login (no spurious redirect)", async ({
    page,
  }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/login");
    await expect(page.getByAltText(viCatalog["program.title"])).toBeVisible();
  });
});
