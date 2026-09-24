import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { UserProvisioningService } from '@/server/services/userProvisioningService';
import { cookies } from 'next/headers';
import { safeInternalPath } from '@/lib/security/safe-redirect';

const userService = new UserProvisioningService();

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
 * Handles the Supabase Auth callback after email verification.
 * The user clicks the link in their email, Supabase verifies the token,
 * and redirects here with the auth code exchanged for a session.
 *
 * If the user doesn't have DB rows yet (signup failed mid-way),
 * creates them inside a transaction via UserProvisioningService.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeInternalPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] exchangeCodeForSession failed:', error.message);
    }

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const existingUser = await userService.findUserById(user.id);

        if (!existingUser) {
          const firstName = (user.user_metadata?.first_name as string) ?? '';
          const lastName = (user.user_metadata?.last_name as string) ?? '';

          try {
            await userService.provisionUser({
              id: user.id,
              email: user.email!,
              role: 'customer',
              firstName,
              lastName,
            });
          } catch {
            // DB insert failed. The auth user is already confirmed
            // and cannot be deleted (exchangeCodeForSession already succeeded).
          }
        }

        // Set role cookie for middleware portal guard
        const dbUser = await userService.findUserById(user.id);
        const role = (dbUser?.role as string) ?? 'customer';
        const store = await cookies();
        store.set('zaf_role', role, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        // Redirect to a validated internal path, or the role dashboard
        const destination = next ?? getDashboardForRole(role);

        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${destination}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${destination}`);
        } else {
          return NextResponse.redirect(`${origin}${destination}`);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
