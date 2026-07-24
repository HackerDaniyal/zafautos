import { requireAuth } from '@/lib/auth';
import { PageHeader } from '@/components/admin/ui/page-header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | ZafAutos Admin',
};

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform configuration"
      />
      <div className="rounded-[10px] border border-iron/30 bg-carbon p-8 text-center">
        <p className="text-ash">Settings panel coming soon.</p>
      </div>
    </div>
  );
}
