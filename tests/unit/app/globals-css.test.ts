import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(
  path.join(process.cwd(), "app", "globals.css"),
  "utf8",
);

/**
 * Token presence audit for `app/globals.css`. As features land, each screen
 * documents its token additions here so a missing declaration fails the test
 * before it can ship as a stale visual. Tokens reused from an earlier screen
 * (e.g. `--color-saa-button-primary`) are NOT redeclared — they're already
 * covered by their original-feature tests / shared usage.
 */
describe("globals.css", () => {
  describe("Sun* Kudos — Live Board tokens (Figma frame MaZUn5xHXZ)", () => {
    it("declares the card surface token", () => {
      expect(CSS).toMatch(/--color-saa-kudos-card-bg:\s*#fff8e1\s*;/i);
    });

    it("declares the filter-chip / A.1 input translucent gold (10%)", () => {
      expect(CSS).toMatch(
        /--color-saa-kudos-filter-bg:\s*rgba\(\s*255\s*,\s*234\s*,\s*158\s*,\s*0\.10?\s*\)\s*;/i,
      );
    });

    it("declares the active-filter / inner-content translucent gold (40%)", () => {
      expect(CSS).toMatch(
        /--color-saa-kudos-filter-bg-active:\s*rgba\(\s*255\s*,\s*234\s*,\s*158\s*,\s*0\.40?\s*\)\s*;/i,
      );
    });

    it("declares the hashtag red foreground", () => {
      expect(CSS).toMatch(/--color-saa-kudos-hashtag-fg:\s*#d4271d\s*;/i);
    });

    it("declares the muted timestamp foreground", () => {
      expect(CSS).toMatch(/--color-saa-kudos-time-fg:\s*#999999\s*;/i);
    });

    it("registers the new kudos tokens with Tailwind's @theme block", () => {
      // Each `:root` token MUST be registered in `@theme inline` so utilities
      // like `bg-saa-kudos-card`, `text-saa-kudos-hashtag-fg` are emitted.
      expect(CSS).toMatch(
        /--color-saa-kudos-card:\s*var\(--color-saa-kudos-card-bg\)\s*;/,
      );
      expect(CSS).toMatch(
        /--color-saa-kudos-filter:\s*var\(--color-saa-kudos-filter-bg\)\s*;/,
      );
      expect(CSS).toMatch(
        /--color-saa-kudos-filter-active:\s*var\(--color-saa-kudos-filter-bg-active\)\s*;/,
      );
      expect(CSS).toMatch(
        /--color-saa-kudos-hashtag-fg:\s*var\(--color-saa-kudos-hashtag-fg\)\s*;/,
      );
      expect(CSS).toMatch(
        /--color-saa-kudos-time-fg:\s*var\(--color-saa-kudos-time-fg\)\s*;/,
      );
    });
  });

  describe("reused tokens — sanity (cross-feature integrity)", () => {
    it("keeps the golden CTA token used by Awards / Kudos card border / stat value", () => {
      expect(CSS).toMatch(/--color-saa-button-primary:\s*#ffea9e\s*;/i);
    });

    it("keeps the divider token used by Footer / Kudos sidebar divider", () => {
      expect(CSS).toMatch(/--color-saa-divider:\s*#2e3940\s*;/i);
    });

    it("keeps the page-fg white used by Kudos section subtitle", () => {
      expect(CSS).toMatch(/--color-saa-page-fg:\s*#ffffff\s*;/i);
    });
  });
});
