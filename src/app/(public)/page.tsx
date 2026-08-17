import type { Metadata } from 'next';
import { getHomepageData } from '@/lib/homepage-data';
import { HomepageClient } from './homepage-client';

export const metadata: Metadata = {
  title: 'ZafAutos Japan — Premium Japanese Used Vehicles',
  description: 'Premium Japanese used vehicles exported worldwide. Full transparency, trusted inspections, auction-grade quality.',
};

export default async function PublicLandingPage() {
  const { sections, featuredVehicles, latestVehicles } = await getHomepageData();

  return (
    <HomepageClient
      sections={sections}
      featuredVehicles={featuredVehicles}
      latestVehicles={latestVehicles}
    />
  );
}
