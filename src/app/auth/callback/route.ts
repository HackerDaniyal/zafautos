import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { UserProvisioningService } from '@/server/services/userProvisioningService';

const userService = new UserProvisioningService();

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
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

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
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
