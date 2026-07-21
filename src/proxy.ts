import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/',
];

const PUBLIC_API_PREFIXES = [
  '/api/v1/auth',
  '/api/v1/vehicles',
  '/api/v1/marketplace',
  '/api/v1/settings',
  '/api/v1/analytics',
];

const PROTECTED_PAGE_PREFIXES = [
  '/admin',
  '/portal',
  '/dealer',
  '/account',
];

const PROTECTED_API_PREFIXES = [
  '/api/v1/orders',
  '/api/v1/customers',
  '/api/v1/dealers',
  '/api/v1/payments',
  '/api/v1/documents',
  '/api/v1/shipping',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const supabaseResponse = await updateSession(request);

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (isProtectedPath(pathname) && pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
