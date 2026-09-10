'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { resendVerification } from '@/server/actions/authActions';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);
  const [resendError, setResendError] = React.useState<string | null>(null);

  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const result = await resendVerification(email);
      if (result.success) {
        setResendSuccess(true);
      } else {
        setResendError(result.error);
      }
    } catch {
      setResendError('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard
        title="Verify your email"
        description="We sent a verification link to your email"
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-signal-red/10">
            <Mail className="size-8 text-signal-red" />
          </div>

          {email && (
            <p className="text-sm text-ash">
              We sent a verification link to{' '}
              <span className="font-medium text-pure-white">{email}</span>
            </p>
          )}

          <p className="text-sm text-ash">
            Click the link in the email to verify your account. If you don&apos;t see it,
            check your spam folder.
          </p>

          {resendSuccess && (
            <div className="flex items-center justify-center gap-2 text-sm text-available-green">
              <CheckCircle2 className="size-4" />
              Verification email sent!
            </div>
          )}

          {resendError && (
            <p className="text-sm text-destructive">{resendError}</p>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResend}
              variant="outline"
              className="w-full"
              disabled={isResending || !email}
            >
              {isResending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>

            <Link
              href="/login"
              className="inline-block text-sm text-signal-red hover:text-ember transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <AuthLayout>
          <AuthCard title="Verify your email" description="Loading...">
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-steel" />
            </div>
          </AuthCard>
        </AuthLayout>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
