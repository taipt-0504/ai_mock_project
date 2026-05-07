import { expect, test } from "@playwright/test";

import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import {
  clearAuthTables,
  disconnect,
  getUserLocale,
  seedAuthenticatedUser,
} from "../fixtures/db";

/**
 * T039 [US4] — Switch UI language on the Homepage (authenticated).
 *
 * Mirrors the Login spec but asserts copy that is unique to the Homepage:
 * an event-info label, the awards section heading, and the footer copyright.
 * Persistence: cookie + `User.locale` row stay flipped after reload.
 */
test.describe("Homepage language switch (US4)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  test("flipping locale on '/' updates event-info, awards heading, and footer copyright; cookie + DB persist on reload", async ({
    page,
    context,
  }) => {
    const { userId, sessionToken } = await seedAuthenticatedUser({
      userId: "home-lang-switch-user",
      email: "home-lang-switch@example.com",
      sessionToken: "home-lang-switch-session",
      locale: "vi-VN",
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

    await page.goto("/");

    // Sanity: the page is rendering Vietnamese copy first.
    await expect(
      page.getByText(viCatalog["home.event.facebook"]),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: viCatalog["home.awards.section.heading"],
      }),
    ).toBeVisible();
    await expect(page.getByText(viCatalog["footer.copyright"])).toBeVisible();

    // Open the language chip and pick EN.
    await page.getByRole("button", { name: /Language: VN/i }).click();
    await page.getByRole("menuitem", { name: /EN/i }).click();

    // English copy appears across all three regions of the page.
    await expect(
      page.getByText(enCatalog["home.event.facebook"]),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole("heading", {
        name: enCatalog["home.awards.section.heading"],
      }),
    ).toBeVisible();
    await expect(page.getByText(enCatalog["footer.copyright"])).toBeVisible();

    // Cookie persists.
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "saa_locale")?.value).toBe("en-US");

    // DB row updated for authenticated users (POST /api/i18n/locale fired).
    await expect.poll(() => getUserLocale(userId)).toBe("en-US");

    // Reload — locale stays flipped (Server Component reads the cookie).
    await page.reload();
    await expect(
      page.getByText(enCatalog["home.event.facebook"]),
    ).toBeVisible();
  });
});
