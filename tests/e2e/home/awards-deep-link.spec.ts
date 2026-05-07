import { expect, test } from "@playwright/test";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "../fixtures/db";

/**
 * T034 [US3] — Clicking an award card navigates to `/awards#<slug>` for that
 * award. Covers FR-012 + SC-003: deep-link routing for at least two distinct
 * awards (Top Talent + MVP) so a single regression doesn't slip through.
 *
 * The destination route `/awards` is owned by a separate spec; this test only
 * asserts the URL becomes the right deep link. A 404 at the destination is
 * OK — we're not exercising the Awards screen here.
 */
test.describe("Awards deep-link navigation (US3 / FR-012)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  async function signIn(context: import("@playwright/test").BrowserContext) {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "awards-deep-link-user",
      email: "awards-deep-link@example.com",
      sessionToken: "awards-deep-link-session",
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
  }

  test("clicking the Top Talent card navigates to /awards#top-talent", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/");

    // Target the card by its concrete href — accessible-name matching is
    // brittle here because the whole card is one anchor (alt + heading +
    // description + 'Chi tiết' all contribute to the name).
    const card = page.locator('a[href="/awards#top-talent"]');
    await expect(card).toBeVisible();
    // Issue the click and await the URL change in parallel — Next.js Link's
    // client-side navigation is async, so reading `page.url()` synchronously
    // can race the route-change.
    await Promise.all([
      page.waitForURL(/\/awards#top-talent$/),
      card.click(),
    ]);
    await expect(page).toHaveURL(/\/awards#top-talent$/);
  });

  test("clicking the MVP card navigates to /awards#mvp", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/");

    const card = page.locator('a[href="/awards#mvp"]');
    await expect(card).toBeVisible();
    await Promise.all([page.waitForURL(/\/awards#mvp$/), card.click()]);
    await expect(page).toHaveURL(/\/awards#mvp$/);
  });

  test("the AwardCard wrapper is a single anchor — title and 'Chi tiết' share the same href", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/");

    // Single anchor per card: the href should resolve consistently.
    const card = page.locator('a[href="/awards#top-talent"]');
    await expect(card).toHaveCount(1);
  });
});
