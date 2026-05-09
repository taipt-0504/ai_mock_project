/**
 * Locale-invariant Vietnamese thousand-separator formatter.
 *
 * Always returns a "." separator (e.g. 7000000 → "7.000.000") regardless of
 * the system locale, so VNĐ values render consistently across server and
 * browser (FR-012).
 */
export function formatVndAmount(value: number): string {
  return value.toLocaleString("vi-VN");
}
