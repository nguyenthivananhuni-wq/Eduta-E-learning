/**
 * Convert string to kebab-case slug. Handles Vietnamese diacritics.
 * "Lập trình Web" → "lap-trinh-web"
 */
export function toKebab(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
