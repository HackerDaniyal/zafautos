import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { DriveTypesClient } from './client';

export const metadata: Metadata = { title: 'Drive Types | ZafAutos Admin' };

export default async function DriveTypesPage() {
  await requireAuth();
  return <DriveTypesClient />;
}
