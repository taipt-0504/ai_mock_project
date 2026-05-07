import enUS from "@/src/lib/i18n/catalogs/en-US.json";
import viVN from "@/src/lib/i18n/catalogs/vi-VN.json";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/lib/i18n/types";

type Catalog = Record<string, string>;

const catalogs: Record<SupportedLocale, Catalog> = {
  "vi-VN": viVN,
  "en-US": enUS,
};

/**
 * Resolve a translation key for the given locale. Falls back to
 * `DEFAULT_LOCALE` if the key is missing in the requested locale.
 *
 * The unit test `tests/unit/lib/i18n/parity.test.ts` enforces that no key is
 * ever missing across catalogs at build time, so the runtime fallback is a
 * defensive guardrail — `console.warn` is used (instead of the structured
 * server logger) to keep this module isomorphic and bundleable in client
 * components.
 */
export function t(key: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const catalog = catalogs[locale];
  if (catalog && key in catalog) {
    return catalog[key]!;
  }
  const fallback = catalogs[DEFAULT_LOCALE];
  if (fallback && key in fallback) {
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console -- isomorphic module: cannot import the server-only logger
      console.warn(
        `[i18n] missing key "${key}" for ${locale}; fell back to ${DEFAULT_LOCALE}`,
      );
    }
    return fallback[key]!;
  }
  if (typeof console !== "undefined") {
    // eslint-disable-next-line no-console -- isomorphic module: cannot import the server-only logger
    console.error(`[i18n] unknown key "${key}" for ${locale}`);
  }
  return key;
}
