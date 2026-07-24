import { requireAuth } from '@/lib/auth';
import { AuthRepository } from '@/server/repositories';
import { eq } from 'drizzle-orm';
import { profiles } from '@/server/db/schema';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dealer Dashboard | ZafAutos Japan',
};

const authRepo = new AuthRepository();

export default async function DealerDashboardPage() {
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
          Dealer Dashboard
        </h1>
        <p className="text-ash">
          Welcome back, {profile?.firstName ?? auth.email}. Manage your inventory and orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-iron/30 bg-carbon p-6">
          <h3 className="text-sm font-medium text-ash">Account</h3>
          <p className="mt-1 text-2xl font-bold text-pure-white">{auth.email}</p>
          <p className="mt-1 text-xs text-steel capitalize">{auth.role.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  );
}
