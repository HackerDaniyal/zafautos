'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/admin/ui/page-header';
import { useToast } from '@/components/admin/ui/use-toast';

interface CustomerFormPageProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    phone?: string | null;
    status: string;
  };
}

export function CustomerFormPage({ mode, initialData }: CustomerFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [firstName, setFirstName] = useState(initialData?.firstName ?? '');
  const [lastName, setLastName] = useState(initialData?.lastName ?? '');
  const [displayName, setDisplayName] = useState(initialData?.displayName ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        toast({ title: 'Customer created', variant: 'success' });
        router.push('/admin/customers');
      } else {
        toast({ title: 'Customer updated', variant: 'success' });
        router.push(`/admin/customers/${initialData!.id}`);
      }
    } catch {
      toast({
        title: 'Error',
        description: `Failed to ${mode} customer`,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create Customer' : 'Edit Customer'}
        description={mode === 'create' ? 'Create a new customer account' : `Editing customer ${initialData?.email}`}
        action={{
          label: 'Back to Customers',
          href: '/admin/customers',
          icon: ArrowLeft,
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-[10px] border border-iron/30 bg-carbon p-6 space-y-6">
          <h3 className="text-lg font-semibold text-pure-white">Personal Information</h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-ash">
                Email <span className="text-signal-red">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                required
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-ash">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-ash">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-[6px] border border-iron/30 bg-deep-carbon px-3 py-2 text-sm text-pure-white placeholder:text-steel focus:outline-none focus:ring-1 focus:ring-signal-red"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" type="button" asChild>
            <Link href="/admin/customers">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading || !email.trim()}>
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {loading
              ? mode === 'create' ? 'Creating...' : 'Saving...'
              : mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
