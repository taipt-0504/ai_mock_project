import type { SupportedLocale } from "@/src/lib/i18n/types";
import { userRepository } from "@/src/repositories/user-repository";

/**
 * Locale orchestration. For authenticated callers we persist the choice on
 * `User.locale` so it follows them across devices (Login spec FR-009 / TR-005).
 * For unauthenticated callers we don't touch the DB — the route handler still
 * writes the `saa_locale` cookie so the choice persists for the current
 * browser (FR-008).
 */
export const localeService = {
  async setLocale(
    userId: string | null,
    locale: SupportedLocale,
  ): Promise<void> {
    if (!userId) return;
    await userRepository.updateLocale(userId, locale);
  },
};
