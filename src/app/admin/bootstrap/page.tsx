'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
import { PasswordInput } from '@/components/auth/password-input';
import { AuthCard, AuthLogo } from '@/components/auth/auth-card';
import { z } from 'zod';
import { adminBootstrap } from '@/server/actions/adminActions';

const bootstrapSchema = z.object({
  email: z.string().email('Invalid email'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  confirmPassword: z.string().min(1, 'Please confirm password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type BootstrapInput = z.infer<typeof bootstrapSchema>;

export default function AdminBootstrapPage() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<BootstrapInput>({
    resolver: zodResolver(bootstrapSchema),
    defaultValues: { email: '', firstName: '', lastName: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(data: BootstrapInput) {
    setIsPending(true);
    setServerError(null);
    try {
      const result = await adminBootstrap(data);
      if (!result.success) {
        setServerError(result.error);
        return;
      }
      setSuccess(true);
    } catch {
      setServerError('An unexpected error occurred.');
    } finally {
      setIsPending(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-race-black px-4">
        <AuthCard title="Super Admin Created" description="You can now sign in">
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-available-green/10">
              <ShieldCheck className="size-6 text-available-green" />
            </div>
            <p className="text-sm text-ash">
              The first Super Admin account has been created. You can now sign in.
            </p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-race-black px-4">
      <AuthCard title="Bootstrap Super Admin" description="Create the first administrator account">
        <div className="mb-4 flex items-start gap-2 rounded-md bg-auction-amber/10 border border-auction-amber/20 p-3 text-xs text-auction-amber">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            This page is only available when no Super Admin exists.
            It will be inaccessible after the first admin is created.
          </span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl><Input placeholder="John" disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl><Input placeholder="Doe" disabled={isPending} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder="admin@zafautos.com" type="email" disabled={isPending} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><PasswordInput placeholder="Strong password" disabled={isPending} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="confirmPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl><PasswordInput placeholder="Confirm password" disabled={isPending} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <><Loader2 className="size-4 animate-spin" /> Creating...</> : 'Create Super Admin'}
            </Button>
          </form>
        </Form>
      </AuthCard>
    </div>
  );
}
