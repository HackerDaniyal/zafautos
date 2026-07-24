import { requireAuth } from '@/lib/auth';
import { AuthRepository } from '@/server/repositories';
import { eq } from 'drizzle-orm';
import { profiles } from '@/server/db/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customer Dashboard | ZafAutos Japan',
};

const authRepo = new AuthRepository();

export default async function CustomerDashboardPage() {
  const auth = await requireAuth();

  const [profile] = await authRepo.profiles.getClient()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, auth.userId))
    .limit(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-pure-white">
          Welcome back, {profile?.firstName ?? 'there'}
        </h1>
        <p className="text-ash">
          Manage your vehicles, orders, and account from your dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-iron/30 bg-carbon p-6">
          <h3 className="text-sm font-medium text-ash">Account</h3>
          <p className="mt-1 text-2xl font-bold text-pure-white">{auth.email}</p>
          <p className="mt-1 text-xs text-steel capitalize">{auth.role.replace('_', ' ')}</p>
        </div>
        <div className="rounded-lg border border-iron/30 bg-carbon p-6">
          <h3 className="text-sm font-medium text-ash">Quick Actions</h3>
          <div className="mt-3 space-y-2">
            <a
              href="/vehicles"
              className="block text-sm text-signal-red hover:text-ember transition-colors"
            >
              Browse vehicles
            </a>
            <a
              href="/customer/orders"
              className="block text-sm text-signal-red hover:text-ember transition-colors"
            >
              View orders
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
