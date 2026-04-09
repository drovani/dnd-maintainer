const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Validates that a slug contains only lowercase letters, digits, and hyphens.
 * Throws if the slug is empty or contains characters that could inject PostgREST operators.
 */
export function validateSlug(slug: string): string {
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid slug format: "${slug}"`);
  return slug;
}
