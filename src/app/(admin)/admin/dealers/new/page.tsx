import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { DealerFormPage } from '../components/dealer-form-page';

export const metadata: Metadata = {
  title: 'Create Dealer | ZafAutos Admin',
};

export default async function NewDealerPage() {
  await requireAuth();
  return <DealerFormPage mode="create" />;
}
