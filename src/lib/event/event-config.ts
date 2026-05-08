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

/**
 * Parses the `SAA_LAUNCH_AT` env value into a `Date`. Mirrors `parseEventStart`'s
 * contract: returns `null` for missing / empty / non-ISO / NaN. The proxy
 * gate treats `null` as "gate active" — always fail closed regardless of
 * `NODE_ENV` (Prelaunch spec FR-009 / SC-004), so an unset env never silently
 * leaves the program open to traffic.
 */
export function parseLaunchAt(envValue: string | undefined): Date | null {
  if (typeof envValue !== "string" || envValue.length === 0) {
    return null;
  }
  const parsed = new Date(envValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}
