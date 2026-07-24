import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | ZafAutos Japan',
  description: 'Set your new ZafAutos Japan account password.',
};

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Set new password"
        description="Enter your new password below"
      >
        <ResetPasswordForm />
      </AuthCard>
    </AuthLayout>
  );
}
