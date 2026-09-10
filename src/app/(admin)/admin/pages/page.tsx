import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { PagesClient } from './client';

export const metadata: Metadata = {
  title: 'Pages | ZafAutos Admin',
};

export default async function PagesListPage() {
  await requireAuth();
  return <PagesClient />;
}
