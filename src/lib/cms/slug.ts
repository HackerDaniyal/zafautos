/**
 * Generates a URL-friendly slug from text.
 * Handles basic ASCII, removes special characters, and converts spaces to hyphens.
 * Japanese/CJK characters are removed as they are not URL-safe without encoding.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validates that a string is a properly formatted slug.
 * Allows lowercase alphanumeric, hyphens, and Japanese characters.
 */
export function isSlugValid(slug: string): boolean {
  return /^[a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+(-[a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]+)*$/.test(slug);
}

/**
 * Converts a slug back to a readable title.
 * Replaces hyphens with spaces and capitalizes each word.
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
