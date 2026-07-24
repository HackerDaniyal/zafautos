import { getPublicEnv } from '@/lib/env';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dealer') ||
    pathname.startsWith('/customer')
  );
}

function isGuestOnlyPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}

/**
 * Middleware handles ONLY Supabase session refresh and basic auth redirects.
 *
 * This runs in Edge runtime — no Drizzle, no postgres.js, no database queries.
 * user_metadata is NEVER read for authorization decisions.
 *
 * Responsibilities:
 * - Auto-refresh JWT session tokens
 * - Redirect unauthenticated users from protected routes to /login
 * - Redirect authenticated users away from guest-only routes to /
 *
 * All role checks, account status checks, and email verification checks
 * occur in requireAuth()/requireRole() within server components, layouts,
 * server actions, or route handlers — where the database is accessible.
 */
export async function updateSession(request: NextRequest) {
  let env: ReturnType<typeof getPublicEnv>;
  try {
    env = getPublicEnv();
  } catch {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Protected routes: redirect unauthenticated users to /login ──────────
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── Guest-only routes: redirect authenticated users to / ───────────────
  // No role resolution in middleware. Server components handle that.
  if (user && isGuestOnlyPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
