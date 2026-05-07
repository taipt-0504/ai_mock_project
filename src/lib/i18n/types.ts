/**
 * Locale support — single source of truth.
 * Adding a locale requires (a) extending `SupportedLocale`, (b) appending
 * to `SUPPORTED_LOCALES`, (c) adding a `LOCALE_DISPLAY` entry, and (d)
 * authoring the matching catalog under `src/lib/i18n/catalogs/`.
 */

export const SUPPORTED_LOCALES = ["vi-VN", "en-US"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "vi-VN";

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Display map for the A.2 language chip — chip code (2-letter language style)
 * and flag asset path. Sourced from Figma frame hUyaaugye2 (dropdown design).
 */
export const LOCALE_DISPLAY: Record<
  SupportedLocale,
  { chip: string; flagAsset: string }
> = {
  "vi-VN": { chip: "VN", flagAsset: "/assets/header/icons/flag-vn.svg" },
  "en-US": { chip: "EN", flagAsset: "/assets/header/icons/flag-en.svg" },
};
