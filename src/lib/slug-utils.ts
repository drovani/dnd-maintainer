/** Matches lowercase alphanumeric slugs: no leading/trailing hyphens, max 128 chars. */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const MAX_SLUG_LENGTH = 128;

/**
 * Validates that a slug contains only lowercase letters, digits, and hyphens.
 * Rejects leading/trailing hyphens and lengths over 128 chars.
 * Throws if the slug is empty or contains characters that could inject PostgREST operators.
 */
export function validateSlug(slug: string): string {
  if (slug.length > MAX_SLUG_LENGTH) throw new Error(`Slug too long (${slug.length} chars, max ${MAX_SLUG_LENGTH})`);
  if (!SLUG_PATTERN.test(slug)) throw new Error(`Invalid slug format: "${slug}"`);
  return slug;
}
