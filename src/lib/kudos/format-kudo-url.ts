/**
 * Build the public share URL for a Kudo (FR-011 Copy Link). The Kudo detail
 * route is owned by `app/sun-kudos/[id]/page.tsx` (Phase 10). In environments
 * where `NEXT_PUBLIC_BASE_URL` is configured the function returns an absolute
 * URL — suitable for clipboard share. Without that env var (local dev /
 * preview deploys) it returns a root-relative path so the link still works
 * when pasted back into the same origin.
 */
export function formatKudoUrl(id: string): string {
  if (!id) {
    throw new Error("formatKudoUrl: id must be a non-empty string");
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ?? "";
  const path = `/sun-kudos/${id}`;
  return base ? `${base}${path}` : path;
}
