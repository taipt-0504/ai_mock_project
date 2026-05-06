import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  isSupportedLocale,
  type SupportedLocale,
} from "@/src/lib/i18n/types";
import { config } from "@/src/lib/config";

const COOKIE_NAME = "saa_locale";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Read + validate the locale cookie. Untrusted input — the value MUST be
 * matched against the supported-locale allowlist (Login spec TR-006 — A03).
 * Out-of-allowlist values fall back to the default and the cookie is
 * cleared so subsequent requests don't re-trigger the warning.
 */
export async function getSaaLocale(): Promise<SupportedLocale> {
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value;
  if (isSupportedLocale(value)) return value;
  if (value !== undefined) {
    // Tampered / stale cookie — clear and fall back.
    try {
      store.delete(COOKIE_NAME);
    } catch {
      // store.delete throws when called outside a mutable context (e.g.
      // a Server Component render). The cookie will be re-cleared on the
      // next mutable request (route handler / Server Action).
    }
  }
  return DEFAULT_LOCALE;
}

export async function setSaaLocale(locale: SupportedLocale): Promise<void> {
  const store = await cookies();
  store.set({
    name: COOKIE_NAME,
    value: locale,
    path: "/",
    sameSite: "lax",
    maxAge: ONE_YEAR_SECONDS,
    secure: config.NODE_ENV === "production",
    httpOnly: false,
  });
}

export async function clearSaaLocale(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
