const ICT_TIMEZONE = "Asia/Ho_Chi_Minh";

const ictDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ICT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Returns the YYYY-MM-DD calendar date of `instant` as observed in
 * Asia/Ho_Chi_Minh. The output ignores wall time entirely — so 23:59:59 ICT
 * and 00:00:00 ICT the next day produce different strings (TR-004 boundary).
 */
function ictDateString(instant: Date): string {
  return ictDateFormatter.format(instant);
}

type SpecialDayLike = { date: Date };

/**
 * Returns true when `instant` falls on any of the supplied SpecialDay rows,
 * comparing dates in `Asia/Ho_Chi_Minh` (FR-010 / TR-004). The DB stores
 * `SpecialDay.date` as `@db.Date` aligned to UTC midnight of the chosen ICT
 * calendar day — formatting both sides through the same ICT calendar
 * collapses any UTC-vs-local offset drift.
 */
export function isSpecialDay(
  instant: Date,
  specialDays: ReadonlyArray<SpecialDayLike>,
): boolean {
  if (specialDays.length === 0) return false;
  const instantDay = ictDateString(instant);
  return specialDays.some((day) => ictDateString(day.date) === instantDay);
}
