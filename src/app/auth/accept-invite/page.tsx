'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/auth/password-input';
import { AuthCard, AuthLogo } from '@/components/auth/auth-card';
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/auth/validation';
import { createClient } from '@/lib/supabase/client';
import { getDefaultDashboard } from '@/server/actions/authActions';

export default function AcceptInvitePage() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(data: ResetPasswordInput) {
    setIsPending(true);
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.password });

      if (error) {
        setServerError(error.message);
        return;
      }

      setSuccess(true);
      const dashboard = await getDefaultDashboard();
      setTimeout(() => router.push(dashboard.success ? dashboard.data.path : '/customer'), 3000);
    } catch {
      setServerError('An unexpected error occurred.');
    } finally {
      setIsPending(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-race-black px-4">
        <AuthCard title="Account Activated" description="Your password has been set">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-available-green/10">
              <CheckCircle2 className="size-6 text-available-green" />
            </div>
            <p className="text-sm text-ash">
              Your account is now active. Redirecting to your dashboard...
            </p>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-race-black px-4">
      <AuthCard title="Set Your Password" description="Complete your account setup">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <p className="text-sm text-ash">
              You&apos;ve been invited to join ZafAutos Japan. Set your password to activate your account.
            </p>

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><PasswordInput placeholder="Create a strong password" autoComplete="new-password" disabled={isPending} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl><PasswordInput placeholder="Confirm your password" autoComplete="new-password" disabled={isPending} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <><Loader2 className="size-4 animate-spin" /> Setting password...</> : 'Activate Account'}
            </Button>
          </form>
        </Form>
      </AuthCard>
    </div>
  );
}
