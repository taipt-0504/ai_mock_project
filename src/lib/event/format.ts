import type { SupportedLocale } from "@/src/lib/i18n/types";

const ICT_TIME_ZONE = "Asia/Ho_Chi_Minh";

/**
 * Formats `SAA_EVENT_START_AT` for the Homepage `EventInfo` row.
 *
 * - vi-VN → `DD/MM/YYYY` (numeric, e.g. `31/12/2025`)
 * - en-US → `Month D, YYYY` (long month, e.g. `December 31, 2025`)
 *
 * The formatter pins to ICT (Asia/Ho_Chi_Minh) so server runtimes in any
 * timezone render the same date the SAA program publishes — the event runs
 * in Vietnam and `SAA_EVENT_START_AT` is authored as an ICT instant.
 */
export function formatEventDate(
  date: Date,
  locale: SupportedLocale,
): string {
  if (locale === "vi-VN") {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: ICT_TIME_ZONE,
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: ICT_TIME_ZONE,
  }).format(date);
}
