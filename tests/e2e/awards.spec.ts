import { expect, test } from "@playwright/test";

import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";
import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";

import { clearAuthTables, disconnect, seedAuthenticatedUser } from "./fixtures/db";

/**
 * Phases 3 + 4 + 5 — Hệ thống giải SAA 2025.
 *
 * Covers US1 (browse the catalog), US5 (auth gating), US2 (scroll-tracking
 * left menu — Phase 4), and US3 + US4 (Sun* Kudos cross-link + Header/Footer
 * parity — Phase 5).
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
    const menu = page.getByRole("navigation", { name: "Awards categories" });
    await expect(menu).toBeVisible();
    await page.waitForLoadState("networkidle");

    await page.locator("article#top-project").scrollIntoViewIfNeeded();

    const topProjectLink = menu.getByRole("link", {
      name: viCatalog["home.awards.top_project.title"],
      exact: true,
    });
    await expect(topProjectLink).toHaveAttribute("aria-current", "true");
  });

  test("US2 — programmatic hashchange (history.replaceState + dispatch) re-syncs the active menu item", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");
    const menu = page.getByRole("navigation", { name: "Awards categories" });
    await expect(menu).toBeVisible();
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      window.history.replaceState(null, "", "#best-manager");
      window.dispatchEvent(new Event("hashchange"));
    });

    const bestManagerLink = menu.getByRole("link", {
      name: viCatalog["home.awards.best_manager.title"],
    });
    await expect(bestManagerLink).toHaveAttribute("aria-current", "true");
  });

  test("US3 #1 — Sun* Kudos block renders with all five required elements (FR-018)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const kudosTitle = page.getByRole("heading", {
      name: viCatalog["home.kudos.title"],
    });
    await expect(kudosTitle).toBeVisible();

    const kudosSection = page.locator("section").filter({ has: kudosTitle });

    await expect(
      kudosSection.getByText(viCatalog["home.kudos.label"]),
    ).toBeVisible();
    await expect(
      kudosSection.getByText(/ĐIỂM MỚI CỦA SAA 2025/),
    ).toBeVisible();
    await expect(kudosSection.getByAltText("Sun* Kudos")).toBeVisible();
    await expect(
      kudosSection.getByRole("link", {
        name: viCatalog["home.kudos.detail_button"],
      }),
    ).toBeVisible();
  });

  test("US3 #2 — clicking 'Chi tiết' navigates to /sun-kudos (FR-008)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const kudosSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: viCatalog["home.kudos.title"] }),
    });
    await kudosSection
      .getByRole("link", {
        name: viCatalog["home.kudos.detail_button"],
      })
      .click();
    await expect(page).toHaveURL(/\/sun-kudos$/);
  });

  test("US4 #1 — language chip opens dropdown with EN option, switching to EN updates copy without reload", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    await expect(
      page.getByRole("heading", {
        name: viCatalog["awards.detail.title_heading"],
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Language: VN/i }).click();
    await page.getByRole("menuitem", { name: /EN/i }).click();

    await expect(
      page.getByRole("heading", {
        name: enCatalog["awards.detail.title_heading"],
      }),
    ).toBeVisible({ timeout: 5_000 });

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "saa_locale")?.value).toBe("en-US");
  });

  test("US4 #2 — profile avatar opens menu; 'Đăng xuất' signs the user out and redirects to /login", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    await page
      .getByRole("button", { name: /E2E User/i })
      .first()
      .click();
    await page
      .getByRole("menuitem", { name: viCatalog["home.profile.sign_out"] })
      .click();

    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("US4 #3 — header 'About SAA 2025' link navigates to '/' (FR-009)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const headerNav = page.getByRole("navigation", { name: "Primary" });
    await headerNav
      .getByRole("link", { name: viCatalog["home.nav.about"] })
      .click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("US4 #4 — footer 'Sun* Kudos' link navigates to /sun-kudos (FR-009)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const footerNav = page.getByRole("navigation", { name: "Footer" });
    await footerNav
      .getByRole("link", { name: viCatalog["home.footer.kudos"] })
      .click();
    await expect(page).toHaveURL(/\/sun-kudos$/);
  });

  test("Edge case — deep-link to an unknown slug renders the page with Top Talent active and no console error (FR-007)", async ({
    page,
    context,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await signIn(context);
    const response = await page.goto("/awards#nonexistent-slug");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", {
        name: viCatalog["awards.detail.title_heading"],
      }),
    ).toBeVisible();

    const menu = page.getByRole("navigation", { name: "Awards categories" });
    const topTalentLink = menu.getByRole("link", {
      name: viCatalog["home.awards.top_talent.title"],
    });
    await expect(topTalentLink).toHaveAttribute("aria-current", "true");

    expect(consoleErrors).toEqual([]);
  });

  test("Edge case — JavaScript disabled: native anchor scroll still navigates (FR-014)", async ({
    browser,
  }) => {
    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const { sessionToken } = await seedAuthenticatedUser({
      userId: "awards-no-js-user",
      email: "awards-no-js@example.com",
      sessionToken: "awards-no-js-session",
    });
    await noJsContext.addCookies([
      {
        name: "authjs.session-token",
        value: sessionToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);

    const noJsPage = await noJsContext.newPage();
    await noJsPage.goto("/awards");

    const menu = noJsPage.getByRole("navigation", { name: "Awards categories" });
    const bestManagerLink = menu.getByRole("link", {
      name: viCatalog["home.awards.best_manager.title"],
    });
    await bestManagerLink.click();

    expect(noJsPage.url()).toContain("#best-manager");
    await expect(noJsPage.locator("article#best-manager")).toBeInViewport();
    await expect(bestManagerLink).not.toHaveAttribute("aria-current", "true");

    await noJsContext.close();
  });

  test("Edge case — locale switch mid-screen flips copy without reload (DOM identity preserved)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");

    const titleHeading = page.getByRole("heading", {
      name: viCatalog["awards.detail.title_heading"],
    });
    await expect(titleHeading).toBeVisible();

    const sentinelId = await page.evaluate(() => {
      const main = document.querySelector("main");
      if (main === null) return null;
      const stamp = `awards-locale-sentinel-${Date.now()}`;
      main.setAttribute("data-sentinel", stamp);
      return stamp;
    });
    expect(sentinelId).not.toBeNull();

    await page.getByRole("button", { name: /Language: VN/i }).click();
    await page.getByRole("menuitem", { name: /EN/i }).click();

    await expect(
      page.getByRole("heading", {
        name: enCatalog["awards.detail.title_heading"],
      }),
    ).toBeVisible({ timeout: 5_000 });

    const stillSentinel = await page.evaluate(
      () => document.querySelector("main")?.getAttribute("data-sentinel") ?? null,
    );
    expect(stillSentinel).toBe(sentinelId);
  });

  test("Edge case — at 360 px viewport the menu is hidden (Q-HTG4 scroll-only fallback)", async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await signIn(context);
    await page.goto("/awards");

    await expect(
      page.getByRole("navigation", { name: "Awards categories" }),
    ).toBeHidden();

    await expect(page.locator("article#top-talent")).toBeVisible();
    await expect(page.locator("article#mvp")).toBeAttached();
  });

  test("US2 #2 — left menu sticks to viewport top while the user scrolls through the cards (FR-005)", async ({
    page,
    context,
  }) => {
    await signIn(context);
    await page.goto("/awards");
    const menu = page.getByRole("navigation", { name: "Awards categories" });
    await expect(menu).toBeVisible();
    await page.waitForLoadState("networkidle");

    // Scroll to a middle card so the AwardsLayout section still encloses
    // the viewport top — sticky elements only stick within their
    // containing block, so scrolling all the way to the last card would
    // move the section's bottom edge above the viewport.
    await page.locator("article#top-project-leader").scrollIntoViewIfNeeded();

    await expect(menu).toBeInViewport();
    const menuTop = await menu.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(menuTop).toBeGreaterThanOrEqual(0);
    expect(menuTop).toBeLessThan(80);
  });
});
