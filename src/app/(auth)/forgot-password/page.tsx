import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | ZafAutos Japan',
  description: 'Reset your ZafAutos Japan account password.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Forgot your password?"
        description="We'll send you a reset link"
        footer={
          <p>
            Remember your password?{' '}
            <a href="/login" className="text-signal-red hover:text-ember transition-colors font-medium">
              Sign in
            </a>
          </p>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthLayout>
  );
}
