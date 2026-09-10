import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | ZafAutos Japan',
  description: 'Sign in to your ZafAutos Japan account.',
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Welcome back"
        description="Sign in to your account to continue"
        footer={
          <p>
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-signal-red hover:text-ember transition-colors font-medium">
              Create one
            </a>
          </p>
        }
      >
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}
