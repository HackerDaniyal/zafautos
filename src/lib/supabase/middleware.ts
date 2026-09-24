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
    pathname.startsWith('/customer') ||
    pathname.startsWith('/account')
  );
}

function isGuestOnlyPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}

/**
 * Determine the correct dashboard path for a given role.
 */
function getDashboardForRole(role: string): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin';
    case 'dealer':
      return '/dealer';
    default:
      return '/customer';
  }
}

/**
 * Check if a pathname belongs to a specific role's portal.
 */
function isPathForRole(pathname: string, role: string): boolean {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return pathname.startsWith('/admin');
    case 'dealer':
      return pathname.startsWith('/dealer');
    case 'customer':
      return pathname.startsWith('/customer') || pathname.startsWith('/account');
    default:
      return false;
  }
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
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
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

  // DEVELOPMENT BYPASS — Only works when AUTH_BYPASS=true AND NODE_ENV=development
  if (process.env.AUTH_BYPASS === 'true' && process.env.NODE_ENV === 'development') {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;
  const code = request.nextUrl.searchParams.get('code');

  // ── Auth code arrived at wrong URL — redirect to callback ──────────────
  // Supabase may redirect to /?code=xxx instead of /auth/callback?code=xxx
  if (code && pathname !== '/auth/callback') {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    // Keep the code and any other params
    return NextResponse.redirect(url);
  }

  // ── Protected routes: redirect unauthenticated users to /login ──────────
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // ── Role-based portal guard: redirect users to their correct portal ─────
  if (user && isProtectedPath(pathname)) {
    const roleCookie = request.cookies.get('zaf_role');
    const role = roleCookie?.value;

    if (role && !isPathForRole(pathname, role)) {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardForRole(role);
      return NextResponse.redirect(url);
    }
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
