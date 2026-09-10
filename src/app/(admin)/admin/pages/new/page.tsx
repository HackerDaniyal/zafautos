import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { PageForm } from '../page-form';

export const metadata: Metadata = {
  title: 'New Page | ZafAutos Admin',
};

export default async function NewPagePage() {
  await requireAuth();
  return <PageForm />;
}
