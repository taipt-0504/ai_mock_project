import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "./fixtures/db";

/**
 * Phase 3 + 4 — Hệ thống giải SAA 2025.
 *
 * Covers US1 (browse the catalog), US5 (auth gating), and US2 (scroll-tracking
 * left menu — Phase 4). Cross-link / header-parity scenarios (US3 / US4) land
 * in Phase 5.
 */

const CANONICAL_SLUGS = [
  "top-talent",
  "top-project",
  "top-project-leader",
  "best-manager",
  "signature-2025-creator",
  "mvp",
] as const;

test.describe("Awards page — US1 + US5", () => {
  test.beforeEach(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await clearAuthTables();
    await disconnect();
  });

  async function signIn(context: import("@playwright/test").BrowserContext) {
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "awards-page-user",
      email: "awards-page@example.com",
      sessionToken: "awards-page-session",
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

  test("US5 #1 — anonymous request to /awards is redirected to /login (no markup leak)", async ({
    page,
  }) => {
    const response = await page.goto("/awards", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(page.url()).toMatch(/\/login(\?|$)/);
  });

  test("US1 #1 — authenticated visit renders six cards in canonical order", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const articles = page.locator("main article");
    await expect(articles).toHaveCount(6);

    const ids = await articles.evaluateAll((els) =>
      els.map((el) => el.getAttribute("id")),
    );
    expect(ids).toEqual([...CANONICAL_SLUGS]);
  });

  test("US1 #1 — header marks 'Awards Information' as the active link via aria-current=page", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const activeNav = page.locator(
      'header a[aria-current="page"][href="/awards"]',
    );
    await expect(activeNav).toBeVisible();
  });

  test("Sun* Kudos block visible at the bottom (US3 placeholder — full assertion lands in Phase 5)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    await expect(
      page.getByRole("heading", { name: viCatalog["home.kudos.title"] }),
    ).toBeVisible();
  });

  test("Footer renders with the Sun* copyright text", async ({ page, context }) => {
    await signIn(context);
    await page.goto("/awards");

    await expect(
      page.locator("footer", { hasText: viCatalog["footer.copyright"] }),
    ).toBeVisible();
  });

  test("US1 #2 — deep link /awards#mvp lands with the MVP title visible (no header occlusion)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards#mvp");

    const mvpHeading = page.getByRole("heading", {
      name: viCatalog["home.awards.mvp.title"],
    });
    await expect(mvpHeading).toBeVisible();

    const top = await mvpHeading.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(top).toBeGreaterThanOrEqual(0);
  });

  test("US1 #4 — clicking 'Top Talent' menu flips C.1 to aria-current=true and brings D.1 into view", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards#mvp");

    const menu = page.getByRole("navigation", { name: "Awards categories" });
    const topTalentLink = menu.getByRole("link", {
      name: viCatalog["home.awards.top_talent.title"],
    });
    await topTalentLink.click();

    await expect(topTalentLink).toHaveAttribute("aria-current", "true");
    expect(page.url()).toContain("#top-talent");

    const card = page.locator("article#top-talent");
    await expect(card).toBeInViewport();
  });

  test("US2 #1 — programmatic scroll past D.2 marks C.2 as the active menu item", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    await page.evaluate(() => {
      const target = document.getElementById("top-project");
      target?.scrollIntoView({ block: "start" });
    });

    const menu = page.getByRole("navigation", { name: "Awards categories" });
    const topProjectLink = menu.getByRole("link", {
      name: viCatalog["home.awards.top_project.title"],
    });
    await expect(topProjectLink).toHaveAttribute("aria-current", "true");
  });

  test("US2 — programmatic hashchange (history.replaceState + dispatch) re-syncs the active menu item", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    await page.evaluate(() => {
      window.history.replaceState(null, "", "#best-manager");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    const menu = page.getByRole("navigation", { name: "Awards categories" });
    const bestManagerLink = menu.getByRole("link", {
      name: viCatalog["home.awards.best_manager.title"],
    });
    await expect(bestManagerLink).toHaveAttribute("aria-current", "true");
  });
});
