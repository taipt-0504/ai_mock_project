import enUS from "@/src/lib/i18n/catalogs/en-US.json";
import viVN from "@/src/lib/i18n/catalogs/vi-VN.json";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@/src/lib/i18n/types";
import { logger } from "@/src/lib/logger";

type Catalog = Record<string, string>;

const catalogs: Record<SupportedLocale, Catalog> = {
  "vi-VN": viVN,
  "en-US": enUS,
};

/**
 * Resolve a translation key for the given locale. Falls back to
 * `DEFAULT_LOCALE` if the key is missing in the requested locale; logs a
 * warning so catalog drift is visible. The unit test
 * `tests/unit/lib/i18n/parity.test.ts` enforces that no key is ever missing
 * across catalogs at build time.
 */
export function t(key: string, locale: SupportedLocale = DEFAULT_LOCALE): string {
  const catalog = catalogs[locale];
  if (catalog && key in catalog) {
    return catalog[key]!;
  }
  const fallback = catalogs[DEFAULT_LOCALE];
  if (fallback && key in fallback) {
    logger.warn("i18n.missing-key", { key, locale, fallback: DEFAULT_LOCALE });
    return fallback[key]!;
  }
  logger.error("i18n.unknown-key", { key, locale });
  return key;
}
