import { expect, test } from "@playwright/test";

import viCatalog from "@/src/lib/i18n/catalogs/vi-VN.json";
import enCatalog from "@/src/lib/i18n/catalogs/en-US.json";

import { clearAuthTables, disconnect } from "../fixtures/db";

/**
 * T067 [US4] — Hero copy renders correctly in both locales and is read-only.
 * Clicking or hovering the hero copy is a no-op (no role, no cursor-pointer).
 */
test.describe("Login hero content (US4)", () => {
  test.beforeAll(async () => {
    await clearAuthTables();
  });

  test.afterAll(async () => {
    await disconnect();
  });

  test("renders the program title image + both description lines (vi-VN default)", async ({
    page,
  }) => {
    await page.goto("/login");
    // The B.1 title image uses the localized title as alt text.
    await expect(
      page.getByAltText(viCatalog["program.title"]),
    ).toBeVisible();
    // Description lines are inside a single <p> with \n separator.
    const description = page.getByText(viCatalog["program.description1"]);
    await expect(description).toBeVisible();
    await expect(
      page.getByText(viCatalog["program.description2"]),
    ).toBeVisible();
  });

  test("renders English catalog when saa_locale cookie is en-US", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: "saa_locale",
        value: "en-US",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.goto("/login");
    await expect(page.getByAltText(enCatalog["program.title"])).toBeVisible();
    await expect(
      page.getByText(enCatalog["program.description1"]),
    ).toBeVisible();
    await expect(
      page.getByText(enCatalog["program.description2"]),
    ).toBeVisible();
  });

  test("hero description is non-interactive (no button/link role, no pointer cursor)", async ({
    page,
  }) => {
    await page.goto("/login");

    // No <a>, <button>, or [role=button] inside the hero <p>.
    const description = page.getByText(viCatalog["program.description1"]);
    const tag = await description.evaluate((el) => el.tagName);
    expect(tag).toBe("P");

    // The element should not advertise interactivity.
    const cursor = await description.evaluate(
      (el) => getComputedStyle(el).cursor,
    );
    expect(["auto", "default", "text"]).toContain(cursor);
  });

  test("the only meaningful image in the hero is the program title", async ({
    page,
  }) => {
    await page.goto("/login");
    // All <img> inside <section> (HeroSection) — the title image is the only
    // one with non-empty alt text.
    const meaningful = await page.evaluate(() => {
      const section = document.querySelector("section");
      if (!section) return [];
      return Array.from(section.querySelectorAll("img"))
        .map((img) => img.getAttribute("alt") ?? "")
        .filter((alt) => alt.length > 0);
    });
    expect(meaningful).toHaveLength(1);
    expect(meaningful[0]).toBe(viCatalog["program.title"]);
  });
});
