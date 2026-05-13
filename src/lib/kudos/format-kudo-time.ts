const PAD = (n: number) => n.toString().padStart(2, "0");

/**
 * Time renderer for KudosCard timestamps. Matches the Figma C.3.4 sample
 * "10:00 - 10/30/2025" — `HH:mm - MM/DD/YYYY`, 24-hour clock.
 *
 * Server-rendered against the user's locale-agnostic source. We deliberately
 * do NOT use `toLocaleString` so SSR and CSR output stay byte-for-byte
 * identical (avoids hydration mismatch under React 19 strict mode).
 */
export function formatKudoTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const hh = PAD(date.getHours());
  const mm = PAD(date.getMinutes());
  const month = PAD(date.getMonth() + 1);
  const day = PAD(date.getDate());
  const year = date.getFullYear();
  return `${hh}:${mm} - ${month}/${day}/${year}`;
}
