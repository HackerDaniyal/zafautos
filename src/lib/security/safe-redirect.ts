/**
 * Validate an untrusted redirect target and return a safe same-origin path.
 *
 * Returns null when the value is missing or not a safe internal path.
 * Safe paths must start with a single `/`, must not be protocol-relative
 * (`//`, `/\`), must not contain backslashes or control characters, and
 * must not smuggle credentials via `@` in the authority position.
 */
export function safeInternalPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;

  let value = String(raw).trim();
  if (!value) return null;

  try {
    value = decodeURIComponent(value);
  } catch {
    return null;
  }

  value = value.trim();
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//') || value.startsWith('/\\')) return null;
  if (value.includes('\\')) return null;
  if (/[\x00-\x1f\x7f]/.test(value)) return null;

  // Reject authority-like first segments containing `@` (e.g. "/@evil.com",
  // "/user@evil.com"). Same-origin paths can still use `@` after `/` in query.
  const firstSegment = value.slice(1).split(/[/?#]/, 1)[0] ?? '';
  if (firstSegment.includes('@')) return null;

  return value;
}
