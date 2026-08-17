import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { HomepageClient } from './client';

export const metadata: Metadata = {
  title: 'Homepage Sections | ZafAutos Admin',
};

export default async function HomepageSectionsPage() {
  await requireAuth();
  return <HomepageClient />;
}
