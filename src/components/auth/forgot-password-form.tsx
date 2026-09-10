'use client';

import * as React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/auth/validation';
import { forgotPassword } from '@/server/actions/authActions';

function ForgotPasswordForm() {
  const [isPending, setIsPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState('');

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setIsPending(true);
    setServerError(null);

    try {
      const result = await forgotPassword(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setSentEmail(data.email);
      setSent(true);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-available-green/10">
          <CheckCircle2 className="size-6 text-available-green" />
        </div>
        <h3 className="text-lg font-semibold text-pure-white">Check your email</h3>
        <p className="text-sm text-ash">
          We sent a password reset link to{' '}
          <span className="font-medium text-pure-white">{sentEmail}</span>
        </p>
        <p className="text-xs text-steel">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setSentEmail('');
            }}
            className="text-signal-red hover:text-ember transition-colors"
          >
            try again
          </button>
        </p>
        <Link
          href="/login"
          className="inline-block text-sm text-signal-red hover:text-ember transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <p className="text-sm text-ash">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                  disabled={isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            'Send reset link'
          )}
        </Button>
      </form>
    </Form>
  );
}

export { ForgotPasswordForm };
