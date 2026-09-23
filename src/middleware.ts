import { updateSession } from '@/lib/supabase/middleware';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Content-Security-Policy (Phase 8)
// ---------------------------------------------------------------------------
// Design notes — "strongest practical CSP for the current application":
//
// script-src: Next.js App Router embeds the RSC flight payload in inline
//   <script> tags, so a nonce is REQUIRED for any strict script-src. Middleware
//   generates a per-request nonce, puts the full CSP on the REQUEST headers
//   (Next.js app-render reads request headers['content-security-policy'] and
//   stamps the nonce onto rendered scripts) and on the RESPONSE headers
//   (browser enforcement). 'strict-dynamic' lets nonced bootstrap scripts load
//   the same-origin hydration/chunk scripts they need; 'self' remains as the
//   legacy fallback for browsers without strict-dynamic support. There is NO
//   'unsafe-inline' in script-src.
//
// script-src-attr 'none': React attaches listeners programmatically — inline
//   event handler attributes (onclick= etc.) are never emitted by this codebase.
//
// style-src keeps 'unsafe-inline': React style={{...}} attributes are emitted
//   at ~12 component sites (progress bars, sliders, swatches, BackToTopCar).
//   CSP style hashes do not apply to style attributes unless 'unsafe-hashes'
//   + a hash per literal value is used — impossible for dynamic values such as
//   width percentages. Removing 'unsafe-inline' would break these components
//   and is NOT safe to do under the current architecture.
//
// img-src: 'self' (incl. /_next/image optimizer + /flags/*.svg), blob: (client
//   upload previews via URL.createObjectURL in vehicle-form-steps and
//   storage-helpers.getImageDimensions), and the Supabase storage origin for
//   public buckets. No data: (no data: image sources exist in src/).
//
// font-src 'self': next/font self-hosts Inter/Oswald from /_next/static/media.
//
// connect-src: 'self' + Supabase REST/auth. Supabase Realtime (wss:) is not
//   used anywhere in src/, so no wss: source is granted.
//
// frame-ancestors 'none' supplements X-Frame-Options: DENY (modern standard).
//
// The Supabase host is derived from NEXT_PUBLIC_SUPABASE_URL (same source as
// next.config.ts images.remotePatterns) with the previous hardcoded host as
// fallback so behavior cannot silently regress if the env var is missing.

function getSupabaseOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try {
      return new URL(url).origin;
    } catch {
      // fall through to the historical default
    }
  }
  return 'https://xskrzrxvjjlswpiqwnnz.supabase.co';
}

function buildContentSecurityPolicy(nonce: string): string {
  const supabaseOrigin = getSupabaseOrigin();
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: ${supabaseOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${supabaseOrigin}`,
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  // Per-request nonce (Edge-safe btoa; matches Next's nonce source regex).
  const nonce = btoa(crypto.randomUUID());
  const csp = buildContentSecurityPolicy(nonce);

  // Forward the CSP on the REQUEST so Next.js app-render can extract the nonce
  // (getScriptNonceFromHeader) and stamp it on inline <script>/<style> tags.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', csp);
  const nextRequest = new NextRequest(request, { headers: requestHeaders });

  const response = await updateSession(nextRequest);

  // Mutate the response in place so Set-Cookie headers from updateSession
  // (Supabase session refresh) are preserved untouched.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
