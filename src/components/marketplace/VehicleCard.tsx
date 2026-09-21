"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Scale, Fuel, Gauge, Calendar, MapPin, Camera, Ship, MapPinned, Gauge as Speedometer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatMileage } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useWishlistCompare } from '@/contexts/WishlistCompareContext';

export interface VehicleCardData {
  id: string;
  slug: string;
  make: string;
  model: string;
  year: number;
  price: number;
  currency: string;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  location: string;
  condition: string;
  destinationCountry?: string;
  destinationCountryIds?: string[];
  isFeatured?: boolean;
  isReserved?: boolean;
  imageUrl?: string | null;
  imageCount?: number;
  stockId?: string | null;
  fobPrice?: boolean;
  arrivalEstimate?: string;
  recentlyAdded?: boolean;
}

interface VehicleCardProps {
  vehicle: VehicleCardData;
  variant?: 'grid' | 'list';
  isWishlisted?: boolean;
  isCompared?: boolean;
  onWishlistToggle?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
}

function VehicleImage({
  vehicle,
  className,
  size = 'grid',
}: {
  vehicle: VehicleCardData;
  className?: string;
  size?: 'grid' | 'list';
}) {
  const [imgError, setImgError] = useState(false);
  const hasImage = vehicle.imageUrl && !imgError;

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      {hasImage ? (
        <Image
          src={vehicle.imageUrl!}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          fill
          sizes={size === 'list' ? '(max-width: 640px) 100vw, 288px' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-gray-300">
          <Camera className="h-10 w-10" strokeWidth={1} />
          <span className="text-[10px] font-medium uppercase tracking-[0.15em]">No Photo Available</span>
        </div>
      )}
      {/* Badges */}
      <div className="absolute left-2 top-2 flex flex-col gap-1 items-start z-20">
        {vehicle.isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-signal-red px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
            Featured
          </span>
        )}
        {vehicle.recentlyAdded && (
          <span className="inline-flex items-center gap-1 rounded-[3px] bg-emerald-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
            New
          </span>
        )}
      </div>
      {vehicle.isReserved && (
        <span className="absolute right-2 top-2 rounded-[3px] bg-amber-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm z-20">
          Reserved
        </span>
      )}
      {vehicle.imageCount && vehicle.imageCount > 1 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm z-20">
          <Camera className="h-3 w-3" />
          {vehicle.imageCount}
        </div>
      )}
    </div>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="h-3 w-3 shrink-0 text-gray-400" />
      <span className="text-[10px] text-gray-400 truncate">{label}</span>
      <span className="text-[11px] font-medium text-gray-700 truncate">{value}</span>
    </div>
  );
}

export function VehicleCard({
  vehicle,
  variant = 'grid',
}: VehicleCardProps) {
  const { isWishlisted, isCompared, toggleWishlist, toggleCompare } = useWishlistCompare();
  const { formatConvertedPrice } = useCurrency();
  const wishlisted = isWishlisted(vehicle.id);
  const compared = isCompared(vehicle.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(vehicle.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(vehicle.id);
  };

  const priceFormatted = formatConvertedPrice(vehicle.price, vehicle.currency);
  const mileageFormatted = vehicle.mileage > 0 ? `${formatMileage(vehicle.mileage)} km` : null;

  if (variant === 'list') {
    return (
      <div className="group overflow-hidden rounded-[10px] border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-md">
        <div className="flex flex-col sm:flex-row h-full">
          <Link href={`/vehicles/${vehicle.slug}`} className="relative shrink-0 sm:w-64 xl:w-72 block overflow-hidden">
            <VehicleImage vehicle={vehicle} className="aspect-[16/10] sm:aspect-auto sm:h-full" size="list" />
          </Link>

          <div className="flex flex-1 flex-col justify-between min-w-0">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {vehicle.stockId && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">{vehicle.stockId}</span>
                    )}
                    {vehicle.bodyType && (
                      <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{vehicle.bodyType}</span>
                    )}
                  </div>
                  <Link href={`/vehicles/${vehicle.slug}`} className="group/title block">
                    <h3 className="font-[Oswald] text-lg font-bold uppercase tracking-[0.3px] text-gray-900 group-hover/title:text-signal-red transition-colors line-clamp-1">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                  </Link>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-[Oswald] text-xl font-bold text-gray-900">{priceFormatted}</p>
                  {vehicle.fobPrice && <span className="text-[9px] uppercase font-medium text-gray-400 tracking-wider">FOB Price</span>}
                </div>
              </div>

              {vehicle.arrivalEstimate && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded">
                  <Ship className="h-3 w-3" />
                  <span>Est. Arrival: <span className="font-medium text-gray-700">{vehicle.arrivalEstimate}</span></span>
                </div>
              )}

              <div className="mt-4 border-t border-gray-100 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                {mileageFormatted && <SpecItem icon={Gauge} label="Mileage" value={mileageFormatted} />}
                <SpecItem icon={Fuel} label="Fuel" value={vehicle.fuelType} />
                <SpecItem icon={Calendar} label="Year" value={String(vehicle.year)} />
                {vehicle.location && <SpecItem icon={MapPin} label="Location" value={vehicle.location} />}
              </div>
            </div>

            <div className="border-t border-gray-100 p-3 sm:px-5 flex items-center justify-between">
              <div className="flex gap-0.5">
                <button
                  onClick={handleWishlist}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    wishlisted ? 'text-signal-red' : 'text-gray-400 hover:text-gray-900'
                  )}
                  title="Add to wishlist"
                >
                  <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
                </button>
                <button
                  onClick={handleCompare}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    compared ? 'text-signal-red' : 'text-gray-400 hover:text-gray-900'
                  )}
                  title="Compare"
                >
                  <Scale className="h-4 w-4" />
                </button>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-[6px] px-5 py-2 text-xs font-medium uppercase tracking-wider"
              >
                <Link href={`/vehicles/${vehicle.slug}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div className="group overflow-hidden rounded-[10px] border border-gray-200 bg-white transition-all duration-300 hover:border-gray-300 hover:shadow-md flex flex-col h-full">
      <Link href={`/vehicles/${vehicle.slug}`} className="relative block shrink-0 overflow-hidden">
        <VehicleImage vehicle={vehicle} className="aspect-[16/10]" />
      </Link>

      <div className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {vehicle.stockId && (
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[9px] text-gray-500 uppercase shrink-0">{vehicle.stockId}</span>
            )}
            {vehicle.bodyType && (
              <span className="text-[10px] text-gray-400 truncate">{vehicle.bodyType}</span>
            )}
          </div>
        </div>

        <Link href={`/vehicles/${vehicle.slug}`} className="group/title block">
          <h3 className="font-[Oswald] text-[15px] font-bold uppercase tracking-[0.3px] text-gray-900 line-clamp-1 group-hover/title:text-signal-red transition-colors" title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2.5">
          {mileageFormatted && (
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-600">{mileageFormatted}</span>
            </div>
          )}
          {vehicle.fuelType && (
            <div className="flex items-center gap-1.5">
              <Fuel className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-600">{vehicle.fuelType}</span>
            </div>
          )}
          {vehicle.transmission && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-gray-600">{vehicle.transmission}</span>
            </div>
          )}
          {vehicle.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-600 truncate">{vehicle.location}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-[Oswald] text-lg font-bold text-gray-900 leading-none">{priceFormatted}</p>
            {vehicle.fobPrice && <span className="text-[9px] uppercase font-medium text-gray-400 tracking-wider">FOB</span>}
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={handleWishlist}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded transition-colors',
                wishlisted ? 'text-signal-red' : 'text-gray-400 hover:text-gray-900'
              )}
              title="Add to wishlist"
            >
              <Heart className={cn('h-3.5 w-3.5', wishlisted && 'fill-current')} />
            </button>
            <button
              onClick={handleCompare}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded transition-colors',
                compared ? 'text-signal-red' : 'text-gray-400 hover:text-gray-900'
              )}
              title="Compare"
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-7 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-[6px] px-3 text-[10px] font-medium uppercase tracking-wider"
            >
              <Link href={`/vehicles/${vehicle.slug}`}>Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
