import { requireAuth } from '@/lib/auth';
import { LanguagesClient } from './client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Languages | ZafAutos Admin' };

export default async function LanguagesPage() {
  await requireAuth();
  return <LanguagesClient />;
}
