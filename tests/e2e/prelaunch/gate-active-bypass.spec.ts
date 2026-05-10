import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

/**
 * Phase 16 — demo gate-bypass (deploy-time spec change).
 *
 * Run with `SAA_LAUNCH_AT=<future ISO>` so the gate is genuinely active.
 * The npm script `test:e2e:gate-active` is the canonical entry point.
 *
 * Scenarios:
 *   1. Click "Skip pre-launch (demo)" on `/coming-soon` → land on `/`
 *      (or whichever auth-aware route the homepage redirects to —
 *      the bypass cookie is the load-bearing assertion, not the final
 *      destination).
 *   2. With the bypass cookie set, re-visiting `/coming-soon` redirects
 *      to `/` rather than rendering the prelaunch screen.
 *   3. Clicking the "Turn off bypass" banner returns the user to
 *      `/coming-soon` with the cookie cleared, and the gate engages
 *      again on the next visit.
 */
test.describe("Prelaunch gate-active — demo bypass flow (Phase 16)", () => {
  test("clicking the demo-bypass button sets the cookie and lands the user past the gate", async ({
    page,
  }) => {
    await page.goto("/coming-soon");

    const button = page.getByRole("button", {
      name: viCatalog["gate.bypass.alert.button"],
    });
    await expect(button).toBeVisible();

    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith("/coming-soon")),
      button.click(),
    ]);

    // Cookie is set on the response from the Server Action.
    const cookies = await page.context().cookies();
    const bypass = cookies.find((c) => c.name === "saa_gate_bypass");
    expect(bypass?.value).toBe("1");
    expect(bypass?.httpOnly).toBe(true);

    // Revisiting /coming-soon now redirects past the gate. The exact
    // landing route may itself redirect (e.g. / → /login when the user
    // is anonymous); the load-bearing assertion is "we are not on
    // /coming-soon anymore".
    await page.goto("/coming-soon");
    await expect(page).not.toHaveURL(/\/coming-soon/);
  });

  test("clicking 'Turn off bypass' on the banner clears the cookie and re-engages the gate", async ({
    page,
    context,
  }) => {
    // Pre-set the bypass cookie so we land on a post-gate page that
    // mounts the banner. The cookie is httpOnly — set it via the
    // browser context's cookie API rather than by clicking through.
    await context.addCookies([
      {
        name: "saa_gate_bypass",
        value: "1",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    // Land on a post-gate route. /login renders the banner because the
    // bypass cookie is active and the layout banner mounts on every
    // route. Login is auth-agnostic, so we know the page itself loads.
    await page.goto("/login");

    const banner = page.getByRole("status").filter({
      hasText: viCatalog["gate.bypass.banner.text"],
    });
    await expect(banner).toBeVisible();

    const clearBtn = banner.getByRole("button", {
      name: viCatalog["gate.bypass.banner.button"],
    });
    await Promise.all([
      page.waitForURL(/\/coming-soon/),
      clearBtn.click(),
    ]);

    // Cookie is gone after the clear action.
    const after = await context.cookies();
    expect(after.find((c) => c.name === "saa_gate_bypass")).toBeUndefined();

    // The next attempt to visit a gated route bounces back to /coming-soon.
    await page.goto("/login");
    await expect(page).toHaveURL(/\/coming-soon/);
  });
});
