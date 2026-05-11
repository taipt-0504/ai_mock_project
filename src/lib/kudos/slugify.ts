/**
 * kebab-case slug helper for Hashtag rows (T019 of MaZUn5xHXZ plan). Strips
 * Vietnamese diacritics via NFD normalization so "IDOL GIỚI TRẺ" produces a
 * URL-safe `idol-gioi-tre`, collapses non-alphanumerics into single hyphens,
 * trims surrounding hyphens, and lowercases the result.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
