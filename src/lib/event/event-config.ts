/**
 * Parses the `SAA_EVENT_START_AT` env value into a `Date`. Returns `null` for
 * any failure mode (missing, malformed, non-ISO, NaN). The Homepage hero
 * countdown treats `null` as the "Coming soon" fallback (FR-007 / FR-008).
 */
export function parseEventStart(envValue: string | undefined): Date | null {
  if (typeof envValue !== "string" || envValue.length === 0) {
    return null;
  }
  const parsed = new Date(envValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
