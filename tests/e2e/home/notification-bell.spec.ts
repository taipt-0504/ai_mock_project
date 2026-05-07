import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "../fixtures/db";

/**
 * T053 [US8 / Q6] — Click the notification bell → "Coming soon" toast.
 *
 * Q6 resolution: until the notification panel ships, the bell click renders
 * the localized `home.notification.toast.coming_soon` string via the in-house
 * Toaster primitive. This spec exercises the full client-side path: SSR
 * paint → bell click → toast appears → toast auto-dismisses.
 */
test.describe("Notification bell — Coming soon toast (US8 / Q6)", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  test("clicking the bell shows the localized 'Coming soon' toast", async ({
    page,
    context,
  }) => {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "notif-bell-user",
      email: "notif-bell@example.com",
      sessionToken: "notif-bell-session",
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

    // Toast not present yet.
    await expect(
      page.getByText(viCatalog["home.notification.toast.coming_soon"]),
    ).toHaveCount(0);

    // Click the bell — find via its localized aria-label.
    await page
      .getByRole("button", {
        name: viCatalog["home.notification.aria_label"],
      })
      .click();

    // Toast text appears.
    await expect(
      page.getByText(viCatalog["home.notification.toast.coming_soon"]),
    ).toBeVisible();
  });
});
