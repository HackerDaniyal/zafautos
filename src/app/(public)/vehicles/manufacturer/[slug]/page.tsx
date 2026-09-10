import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SeoLandingPage } from '@/components/marketplace/SeoLandingPage';
import { getManufacturerSeoData } from '@/lib/public-seo-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zafautos.com';

interface ManufacturerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ManufacturerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getManufacturerSeoData(slug);
  if (!data) return { title: 'Manufacturer Not Found | ZafAutos' };

  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: data.canonicalUrl,
    },
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website',
      url: data.canonicalUrl,
    },
  };
}

export default async function ManufacturerPage({ params }: ManufacturerPageProps) {
  const { slug } = await params;
  const data = await getManufacturerSeoData(slug);

  if (!data) {
    notFound();
  }

  // JSON-LD for collection page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: data.title,
    description: data.description,
    url: data.canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: data.totalVehicles,
      itemListElement: data.vehicles.slice(0, 20).map((v, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: `${v.year} ${v.make} ${v.model}`,
          url: `${SITE_URL}/vehicles/${v.slug}`,
          image: v.imageUrl || undefined,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoLandingPage {...data} />
    </>
  );
}
