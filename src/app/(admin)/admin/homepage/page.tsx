import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';
import { getHomepageData } from '@/lib/homepage-data';
import { HomepageClient } from './client';

export const metadata: Metadata = {
  title: 'Homepage Builder | ZafAutos Admin',
};

export default async function HomepageSectionsPage() {
  await requireAuth();
  const data = await getHomepageData();
  return <HomepageClient homepageData={data} />;
}
