import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { SeoLandingPage } from '@/components/marketplace/SeoLandingPage';
import { getDestinationSeoData } from '@/lib/public-seo-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zafautos.com';

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDestinationSeoData(slug);
  if (!data) return { title: 'Destination Not Found | ZafAutos' };

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

export default async function DestinationPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const data = await getDestinationSeoData(slug);

  if (!data) {
    notFound();
  }

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
