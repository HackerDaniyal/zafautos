'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Gauge, Fuel, Calendar, MapPin, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VehicleImageGallery } from '@/components/marketplace/VehicleImageGallery';
import { VehicleSpecsTable } from '@/components/marketplace/VehicleSpecsTable';
import { VehicleContactForm } from '@/components/marketplace/VehicleContactForm';
import { SimilarVehicles } from '@/components/marketplace/SimilarVehicles';
import { placeholderVehicles } from '@/data/placeholderVehicles';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { ChequeredDivider } from '@/components/ui/ChequeredDivider';
import { formatPrice, formatMileage } from '@/lib/utils';

interface VehicleDetailClientProps {
  vehicle: VehicleCardData;
}

export function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const similar = placeholderVehicles
    .filter((v) => v.id !== vehicle.id && v.make === vehicle.make)
    .slice(0, 4);

  const priceFormatted = formatPrice(vehicle.price, vehicle.currency);

  const scrollToEnquiry = () => {
    document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-ash">
        <Link href="/vehicles" className="hover:text-pure-white transition-colors">
          <ArrowLeft className="mr-1 inline h-4 w-4" />
          Inventory
        </Link>
        <span>/</span>
        <span className="text-pure-white">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: Gallery + Details */}
        <div className="space-y-8">
          {/* Image Gallery */}
          <VehicleImageGallery />

          {/* Title + Price (Mobile) */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2 mb-2">
              {vehicle.stockId && (
                <span className="font-mono bg-iron/50 px-1.5 py-0.5 rounded text-[10px] text-steel uppercase">{vehicle.stockId}</span>
              )}
              <span className="text-[11px] font-medium uppercase tracking-wider text-ash">{vehicle.condition}</span>
            </div>
            <h1 className="font-[Oswald] text-2xl font-bold uppercase tracking-[0.3px] text-pure-white md:text-3xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="price-tag mt-2">{priceFormatted}</p>
          </div>

          <ChequeredDivider />

          {/* Quick Specs Strip */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 shrink-0 text-[#5A5A5A]" />
              <span className="text-[11px] uppercase tracking-wider text-[#6E6E6E]">Mileage</span>
              <span className="text-[13px] font-medium text-white">{formatMileage(vehicle.mileage)} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 shrink-0 text-[#5A5A5A]" />
              <span className="text-[11px] uppercase tracking-wider text-[#6E6E6E]">Fuel</span>
              <span className="text-[13px] font-medium text-white">{vehicle.fuelType}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-[#5A5A5A]" />
              <span className="text-[11px] uppercase tracking-wider text-[#6E6E6E]">Year</span>
              <span className="text-[13px] font-medium text-white">{vehicle.year}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#5A5A5A]" />
              <span className="text-[11px] uppercase tracking-wider text-[#6E6E6E]">Location</span>
              <span className="text-[13px] font-medium text-white">{vehicle.location}</span>
            </div>
            {vehicle.transmission && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#6E6E6E]">Trans</span>
                <span className="text-[13px] font-medium text-white">{vehicle.transmission}</span>
              </div>
            )}
            {vehicle.bodyType && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-[#6E6E6E]">Body</span>
                <span className="text-[13px] font-medium text-white">{vehicle.bodyType}</span>
              </div>
            )}
          </div>

          {vehicle.arrivalEstimate && (
            <div className="flex items-center gap-2 text-sm text-chrome-silver bg-carbon border border-iron rounded-[6px] px-4 py-3">
              <Ship className="h-4 w-4 text-steel" />
              <span>Estimated Arrival: <span className="font-medium text-pure-white">{vehicle.arrivalEstimate}</span></span>
            </div>
          )}

          <ChequeredDivider />

          {/* Full Specifications */}
          <VehicleSpecsTable
            specs={{
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              bodyType: vehicle.bodyType,
              fuelType: vehicle.fuelType,
              transmission: vehicle.transmission,
              mileage: vehicle.mileage,
              condition: vehicle.condition,
              location: vehicle.location,
              stockNumber: vehicle.stockId,
            }}
          />
        </div>

        {/* Right: Sticky Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start space-y-6">
          {/* Title + Price (Desktop) */}
          <div className="hidden lg:block rounded-[10px] border border-iron bg-carbon p-6">
            <div className="flex items-center gap-2 mb-3">
              {vehicle.stockId && (
                <span className="font-mono bg-iron/50 px-1.5 py-0.5 rounded text-[10px] text-steel uppercase">{vehicle.stockId}</span>
              )}
              <span className="text-[11px] font-medium uppercase tracking-wider text-ash">{vehicle.condition}</span>
            </div>
            <h1 className="font-[Oswald] text-2xl font-bold uppercase tracking-[0.3px] text-pure-white">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="price-tag mt-3">{priceFormatted}</p>
            {vehicle.fobPrice && <span className="text-[10px] uppercase font-medium text-steel tracking-wider">FOB Price</span>}

            <Button onClick={scrollToEnquiry} className="w-full mt-4 bg-signal-red hover:bg-deep-red text-pure-white rounded-[6px] font-[Oswald] uppercase tracking-wider">
              Enquire Now
            </Button>
          </div>

          {/* Contact Form */}
          <VehicleContactForm vehicleTitle={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} />
        </div>
      </div>

      {/* Similar Vehicles */}
      {similar.length > 0 && (
        <div className="mt-16">
          <ChequeredDivider className="mb-8" />
          <SimilarVehicles vehicles={similar} />
        </div>
      )}
    </div>
  );
}
