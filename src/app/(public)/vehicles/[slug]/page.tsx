import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { VehicleDetailClient } from './VehicleDetailClient';
import { getPublicVehicleBySlug, getSimilarPublicVehicles } from '@/server/actions/publicVehicleActions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://zafautos.com';

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getVehicleData(slug: string) {
  const data = await getPublicVehicleBySlug(slug);
  return data;
}

export async function generateMetadata({ params }: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getVehicleData(slug);
  if (!data) return { title: 'Vehicle Not Found | ZafAutos' };

  const { vehicle } = data;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for Sale | ZafAutos`;
  const description = `${vehicle.year} ${vehicle.make} ${vehicle.model} — ${vehicle.mileage.toLocaleString()} km, ${vehicle.fuelType}, ${vehicle.transmission}. Available for export from ${vehicle.location}.${vehicle.price > 0 ? ` Price: ${vehicle.currency} ${vehicle.price.toLocaleString()}.` : ''}`;
  const vehicleUrl = `${SITE_URL}/vehicles/${vehicle.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: vehicleUrl,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: vehicleUrl,
      images: data.images.length > 0
        ? [{ url: data.images[0].imageUrl, width: 1200, height: 630, alt: `${vehicle.year} ${vehicle.make} ${vehicle.model}` }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: data.images.length > 0 ? [data.images[0].imageUrl] : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params;
  const data = await getVehicleData(slug);

  if (!data) {
    notFound();
  }

  const similar = await getSimilarPublicVehicles(
    data.vehicle.manufacturerId,
    data.vehicle.id,
    4,
    {
      modelId: (data.vehicle as any).modelId,
      bodyTypeId: (data.vehicle as any).bodyTypeId,
      price: data.vehicle.price,
    },
  );

  // Build JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model}`,
    description: `${data.vehicle.year} ${data.vehicle.make} ${data.vehicle.model} — ${data.vehicle.mileage.toLocaleString()} km, ${data.vehicle.fuelType}, ${data.vehicle.transmission}. Available for export from ${data.vehicle.location}.`,
    brand: {
      '@type': 'Brand',
      name: data.vehicle.make,
    },
    model: data.vehicle.model,
    image: data.images.length > 0 ? data.images.map((img) => img.imageUrl) : undefined,
    url: `${SITE_URL}/vehicles/${data.vehicle.slug}`,
    offers: data.vehicle.price > 0 ? {
      '@type': 'Offer',
      price: data.vehicle.price,
      priceCurrency: data.vehicle.currency,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'Organization',
        name: 'ZafAutos',
        url: SITE_URL,
      },
    } : undefined,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Mileage', value: `${data.vehicle.mileage.toLocaleString()} km` },
      { '@type': 'PropertyValue', name: 'Fuel Type', value: data.vehicle.fuelType },
      { '@type': 'PropertyValue', name: 'Transmission', value: data.vehicle.transmission },
      { '@type': 'PropertyValue', name: 'Body Type', value: data.vehicle.bodyType },
      ...(data.vehicle.driveType ? [{ '@type': 'PropertyValue', name: 'Drive Type', value: data.vehicle.driveType }] : []),
      ...(data.vehicle.condition ? [{ '@type': 'PropertyValue', name: 'Condition', value: data.vehicle.condition }] : []),
      ...(data.vehicle.vin ? [{ '@type': 'PropertyValue', name: 'VIN', value: data.vehicle.vin }] : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VehicleDetailClient
        vehicle={data.vehicle}
        images={data.images}
        features={data.features}
        similar={similar}
      />
    </>
  );
}
