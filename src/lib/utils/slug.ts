/**
 * generateSlug — converts a human-readable title into a URL-safe slug.
 *
 * Algorithm:
 *  1. NFD normalise → strip diacritic marks
 *  2. Lowercase
 *  3. Replace sequences of non-alphanumeric chars with a single hyphen
 *  4. Trim leading / trailing hyphens
 *  5. Truncate to 80 chars at a hyphen boundary (no mid-word break)
 */
export function generateSlug(title: string): string {
  if (!title) return ''

  const base = title
    .normalize('NFD')
    // Strip combining diacritical marks (U+0300–U+036F)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Collapse any run of non-alphanumeric characters to a single hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Trim leading and trailing hyphens
    .replace(/^-+|-+$/g, '')

  if (base.length <= 80) return base

  // Truncate to 80 chars without cutting mid-word
  const truncated = base.slice(0, 80)
  const lastHyphen = truncated.lastIndexOf('-')

  // If no hyphen found, fall back to hard truncation
  const result = lastHyphen > 0 ? truncated.slice(0, lastHyphen) : truncated

  // Remove any trailing hyphen left after slice
  return result.replace(/-+$/, '')
}
