import { placeholderVehicles } from '@/data/placeholderVehicles';
import { VehicleDetailClient } from './VehicleDetailClient';
import { notFound } from 'next/navigation';

interface VehicleDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const { slug } = await params;
  const vehicle = placeholderVehicles.find((v) => v.slug === slug);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailClient vehicle={vehicle} />;
}
