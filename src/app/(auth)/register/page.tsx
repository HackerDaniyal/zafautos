import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account | ZafAutos Japan',
  description: 'Create a ZafAutos Japan account to start importing vehicles.',
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Create your account"
        description="Join ZafAutos Japan to import quality vehicles"
        footer={
          <p>
            Already have an account?{' '}
            <a href="/login" className="text-signal-red hover:text-ember transition-colors font-medium">
              Sign in
            </a>
          </p>
        }
      >
        <RegisterForm />
      </AuthCard>
    </AuthLayout>
  );
}
