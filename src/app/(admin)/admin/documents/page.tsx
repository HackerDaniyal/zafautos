import { requireAuth } from '@/lib/auth';
import { DocumentsClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documents | ZafAutos Admin',
};

export default async function DocumentsPage() {
  await requireAuth();
  return <DocumentsClient />;
}
