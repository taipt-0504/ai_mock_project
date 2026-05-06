import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  LOCALE_DISPLAY,
  SUPPORTED_LOCALES,
} from "@/src/lib/i18n/types";

describe("locale types", () => {
  describe("isSupportedLocale", () => {
    it("returns true for every entry in SUPPORTED_LOCALES", () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(isSupportedLocale(locale)).toBe(true);
      }
    });

    it.each([
      ["fr-FR", "unsupported BCP 47"],
      ["en", "language code only"],
      ["VN", "chip code is not a locale"],
      ["", "empty string"],
      [null, "null"],
      [undefined, "undefined"],
      [42, "number"],
      [{ locale: "vi-VN" }, "object"],
    ])("rejects %p (%s)", (value, label) => {
      expect(isSupportedLocale(value), `should reject ${label}`).toBe(false);
    });
  });

  describe("LOCALE_DISPLAY", () => {
    it("has an entry for every supported locale (parity)", () => {
      for (const locale of SUPPORTED_LOCALES) {
        const entry = LOCALE_DISPLAY[locale];
        expect(entry).toBeDefined();
        expect(entry.chip).toMatch(/^[A-Z]{2}$/);
        expect(entry.flagAsset).toMatch(/^\/assets\/.+\.svg$/);
      }
    });
  });

  it("DEFAULT_LOCALE is supported", () => {
    expect(isSupportedLocale(DEFAULT_LOCALE)).toBe(true);
  });
});
