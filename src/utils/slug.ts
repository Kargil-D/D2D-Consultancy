/**
 * Convert a destination name into a URL-friendly slug.
 *
 *   "Sri Lanka"     -> "sri-lanka"
 *   "United Arab Emirates" -> "united-arab-emirates"
 *   "Cï¿½te d'Ivoire" -> "cote-d-ivoire"
 */
export function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
