import { expect, test, type BrowserContext } from "@playwright/test";

import { PrismaClient } from "@prisma/client";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "./fixtures/db";

/**
 * Phase 3 / US7 — Authentication gate for /sun-kudos.
 *
 * The Live Board is internal: every action requires a valid session.
 * - (a) Anon visit → redirect to /login (US7 #1).
 * - (b) Authenticated visit → render full board (US7 #1 inverse).
 * - (c) Session expired mid-flow → next server request redirects to /login
 *       (US7 #3 page-level gate; the matching API 401 path lands with the
 *       first mutate endpoint in Phase 4 — see T030).
 */

const prisma = new PrismaClient();

async function signIn(
  context: BrowserContext,
  opts?: { userId?: string; email?: string; sessionToken?: string },
): Promise<{ userId: string; sessionToken: string }> {
  const { sessionToken, userId } = await seedAuthenticatedUser({
    userId: opts?.userId ?? "kudos-auth-user",
    email: opts?.email ?? "kudos-auth@example.com",
    sessionToken: opts?.sessionToken ?? "kudos-auth-session",
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
  return { userId, sessionToken };
}

test.describe("Sun* Kudos — auth gate (US7)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await prisma.$disconnect();
    await disconnect();
  });

  test("US7 #1 — anonymous request to /sun-kudos is redirected to /login (no markup leak)", async ({
    page,
  }) => {
    const response = await page.request.get("/sun-kudos", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(response.status());
    expect(response.headers()["location"]).toBe("/login");

    const body = await response.text();
    expect(body).not.toContain("kudos-feed-slot");
    expect(body).not.toContain("kudos-write-input-slot");
  });

  test("US7 #1 — anonymous browser navigation to /sun-kudos lands on /login", async ({
    page,
  }) => {
    await page.goto("/sun-kudos");
    expect(new URL(page.url()).pathname).toBe("/login");
  });

  test("US7 #1 inverse — authenticated visit renders the full board skeleton", async ({
    page,
    context,
  }) => {
    await signIn(context);
    const response = await page.goto("/sun-kudos");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/sun-kudos");

    await expect(page.locator('[data-testid="kudos-write-input-slot"]')).toBeAttached();
    await expect(page.locator('[data-testid="kudos-feed-slot"]')).toBeAttached();
    await expect(page.locator('[data-testid="kudos-sidebar-slot"]')).toBeAttached();
    await expect(page.locator('[data-testid="kudos-highlight-slot"]')).toBeAttached();
    await expect(page.locator('[data-testid="kudos-spotlight-slot"]')).toBeAttached();
    await expect(page.locator('[data-testid="kudos-filter-slot"]')).toBeAttached();
    await expect(page.locator("header a[aria-current=\"page\"][href=\"/sun-kudos\"]"))
      .toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("US7 #3 — expired session mid-flow: a stale session cookie redirects to /login on the next server request", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await signIn(context, {
      userId: "kudos-auth-expire-user",
      email: "kudos-auth-expire@example.com",
      sessionToken: "kudos-auth-expire-session",
    });

    // Confirm the board is reachable while the session is live.
    const liveResponse = await page.goto("/sun-kudos");
    expect(liveResponse?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/sun-kudos");

    // Simulate "session expired mid-action": the cookie remains in the
    // browser but the server row is gone. Auth.js cannot resolve a user,
    // so the page-level gate redirects to /login on the next request.
    await prisma.session.delete({ where: { sessionToken } });

    const apiResponse = await page.request.get("/sun-kudos", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(apiResponse.status());
    expect(apiResponse.headers()["location"]).toBe("/login");

    await page.goto("/sun-kudos");
    expect(new URL(page.url()).pathname).toBe("/login");
  });
});
