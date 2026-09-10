import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication Error | ZafAutos Japan',
  description: 'There was a problem with the authentication link.',
};

export default function AuthCodeErrorPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Authentication error"
        description="There was a problem verifying your email"
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-auction-amber/10">
            <AlertTriangle className="size-8 text-auction-amber" />
          </div>

          <p className="text-sm text-ash">
            The authentication link may have expired or been used already.
            Please try signing in or requesting a new verification email.
          </p>

          <div className="space-y-3">
            <Link href="/login">
              <Button className="w-full">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                Create new account
              </Button>
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
