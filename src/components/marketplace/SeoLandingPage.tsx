'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { VehicleCard, type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';

interface SeoLandingPageProps {
  title: string;
  description: string;
  canonicalUrl: string;
  entity: {
    name: string;
    slug: string;
    type: 'manufacturer' | 'model' | 'bodyType' | 'destination';
    parentName?: string;
  };
  vehicles: VehicleCardData[];
  totalVehicles: number;
  relatedEntities?: Array<{ name: string; slug: string; count: number }>;
}

export function SeoLandingPage({
  title,
  description,
  entity,
  vehicles,
  totalVehicles,
  relatedEntities,
}: SeoLandingPageProps) {
  const breadcrumbBase = entity.type === 'destination' ? 'destination' :
    entity.type === 'bodyType' ? 'body-type' : entity.type;

  return (
    <SectionWrapper className="py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600" aria-label="Breadcrumb">
        <Link href="/vehicles" className="hover:text-gray-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Inventory
        </Link>
        <span className="text-gray-500">/</span>
        {entity.parentName && (
          <>
            <Link
              href={`/vehicles/manufacturer/${entity.type === 'model' ? entity.slug : ''}`}
              className="hover:text-gray-900 transition-colors"
            >
              {entity.parentName}
            </Link>
            <span className="text-gray-500">/</span>
          </>
        )}
        <span className="text-gray-900">{entity.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">{title}</h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl">{description}</p>
        <p className="text-sm text-gray-500 mt-2">
          {totalVehicles.toLocaleString()} vehicle{totalVehicles !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Related entities (e.g., models for manufacturer, manufacturers for body type) */}
      {relatedEntities && relatedEntities.length > 0 && (
        <div className="mb-8">
          <h2 className="font-[Oswald] text-base font-bold uppercase tracking-wider text-gray-900 mb-4">
            {entity.type === 'manufacturer' ? 'Models' :
             entity.type === 'bodyType' ? 'Top Manufacturers' : 'Related'}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedEntities.map((re) => {
              let href = '/vehicles';
              if (entity.type === 'manufacturer') {
                href = `/vehicles/model/${re.slug}`;
              } else if (entity.type === 'bodyType') {
                href = `/vehicles/manufacturer/${re.slug}`;
              } else if (entity.type === 'destination') {
                href = `/vehicles/manufacturer/${re.slug}`;
              }
              return (
                <Link
                  key={re.slug}
                  href={href}
                  className="flex items-center gap-2 rounded-[4px] border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-all"
                >
                  <span>{re.name}</span>
                  <span className="text-[10px] opacity-60">({re.count})</span>
                  <ChevronRight className="h-3 w-3 opacity-40" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Vehicle grid */}
      {vehicles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/10 text-center p-8">
          <p className="text-muted-foreground">No vehicles currently available.</p>
          <Link href="/vehicles" className="text-signal-red hover:underline text-sm">
            Browse all vehicles
          </Link>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 rounded-[6px] bg-signal-red px-6 py-3 text-sm font-medium text-gray-900 hover:bg-deep-red transition-colors"
        >
          View All Vehicles
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </SectionWrapper>
  );
}
