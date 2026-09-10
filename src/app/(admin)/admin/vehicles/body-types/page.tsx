import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { BodyTypesClient } from './client';

export const metadata: Metadata = { title: 'Body Types | ZafAutos Admin' };

export default async function BodyTypesPage() {
  await requireAuth();
  return <BodyTypesClient />;
}
