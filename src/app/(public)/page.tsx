import type { Metadata } from 'next';
import { getHomepageData } from '@/lib/homepage-data';
import { HomepageClient } from './homepage-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ZafAutos Japan — Premium Japanese Used Vehicles',
  description: 'Premium Japanese used vehicles exported worldwide. Full transparency, trusted inspections, auction-grade quality.',
};

export default async function PublicLandingPage() {
  const data = await getHomepageData();

  return (
    <HomepageClient
      sections={data.sections}
      featuredVehicles={data.featuredVehicles}
      latestVehicles={data.latestVehicles}
      currencies={data.currencies}
      exchangeRates={data.exchangeRates}
      makes={data.makes}
      continents={data.continents}
      bodyTypes={data.bodyTypes}
      fuelTypes={data.fuelTypes}
      transmissions={data.transmissions}
      driveTypes={data.driveTypes}
      banners={data.banners}
      testimonials={data.testimonials}
      faqs={data.faqs}
      latestBlogPosts={data.latestBlogPosts}
    />
  );
}
