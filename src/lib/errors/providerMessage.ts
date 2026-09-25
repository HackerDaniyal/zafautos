/**
 * Returns `raw` in development and a generic `fallback` in production so
 * provider/infra error details (Supabase Auth, database driver messages)
 * never reach clients. Mirrors the NODE_ENV gating already used by
 * action-error.ts and errorHandler.ts.
 */
export function providerMessage(raw: string, fallback: string): string {
  return process.env.NODE_ENV === 'development' ? raw : fallback;
}
