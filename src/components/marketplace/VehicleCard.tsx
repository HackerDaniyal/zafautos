"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Scale, Fuel, Gauge, Calendar, MapPin, Share2, Camera, Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatPrice, formatMileage } from '@/lib/utils';

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
  isFeatured?: boolean;
  isReserved?: boolean;
  imageUrl?: string;
  imageCount?: number;
  stockId?: string;
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

export function VehicleCard({
  vehicle,
  variant = 'grid',
  isWishlisted = false,
  isCompared = false,
  onWishlistToggle,
  onCompareToggle,
}: VehicleCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [compared, setCompared] = useState(isCompared);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted((p) => !p);
    onWishlistToggle?.(vehicle.id);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    setCompared((p) => !p);
    onCompareToggle?.(vehicle.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const priceFormatted = formatPrice(vehicle.price, vehicle.currency);

  if (variant === 'list') {
    return (
      <div className="group overflow-hidden rounded-[10px] border border-iron bg-carbon transition-all duration-300 hover:border-steel/30">
        <div className="flex flex-col sm:flex-row h-full">
          <Link href={`/vehicles/${vehicle.slug}`} className="relative shrink-0 sm:w-64 xl:w-72 block overflow-hidden">
            <div className="aspect-[16/10] sm:aspect-auto sm:h-full bg-deep-carbon flex items-center justify-center text-steel text-sm relative">
              {vehicle.imageUrl ? (
                <Image
                  src={vehicle.imageUrl}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Camera className="h-8 w-8 opacity-20" />
                  <span className="text-xs uppercase tracking-wider">No Photo</span>
                </div>
              )}
              {vehicle.imageCount && vehicle.imageCount > 0 && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-race-black/80 px-2 py-1 text-[10px] font-medium text-pure-white backdrop-blur-sm z-10">
                  <Camera className="h-3 w-3" />
                  {vehicle.imageCount}
                </div>
              )}
            </div>
            <div className="absolute left-2 top-2 flex flex-col gap-1 items-start z-10">
              {vehicle.isFeatured && (
                <span className="badge-auction">Featured</span>
              )}
              {vehicle.recentlyAdded && (
                <span className="badge-available">New</span>
              )}
            </div>
            {vehicle.isReserved && (
              <span className="absolute right-2 top-2 badge-sold">Reserved</span>
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {vehicle.stockId && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-steel">{vehicle.stockId}</span>
                    )}
                    <span className={cn(
                      "text-[11px] font-medium uppercase tracking-wider",
                      vehicle.condition.includes('Grade S') ? "text-auction-amber" : "text-ash"
                    )}>{vehicle.condition}</span>
                  </div>
                  <Link href={`/vehicles/${vehicle.slug}`} className="group/title">
                    <h3 className="font-[Oswald] text-lg font-bold uppercase tracking-[0.3px] text-pure-white group-hover/title:text-signal-red transition-colors">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h3>
                  </Link>
                </div>
                <div className="shrink-0">
                  <p className="price-tag">{priceFormatted}</p>
                  {vehicle.fobPrice && <span className="text-[10px] uppercase font-medium text-steel tracking-wider">FOB Price</span>}
                </div>
              </div>

              {vehicle.arrivalEstimate && (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-chrome-silver bg-iron/50 w-fit px-2 py-1 rounded">
                  <Ship className="h-3 w-3" />
                  <span>Est. Arrival: <span className="font-medium text-pure-white">{vehicle.arrivalEstimate}</span></span>
                </div>
              )}

              <div className="mt-4 border-t border-iron pt-3 grid grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 shrink-0 text-[#5A5A5A]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#6E6E6E]">Mileage</span>
                  <span className="text-[11px] font-medium text-white">{formatMileage(vehicle.mileage)} km</span>
                </div>
                <div className="flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 shrink-0 text-[#5A5A5A]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#6E6E6E]">Fuel</span>
                  <span className="text-[11px] font-medium text-white">{vehicle.fuelType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-[#5A5A5A]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#6E6E6E]">Year</span>
                  <span className="text-[11px] font-medium text-white">{vehicle.year}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#5A5A5A]" />
                  <span className="text-[10px] uppercase tracking-wider text-[#6E6E6E]">Location</span>
                  <span className="text-[11px] font-medium text-white truncate">{vehicle.location}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-iron p-3 sm:px-5 flex items-center justify-between">
              <div className="flex gap-1">
                <button
                  onClick={handleWishlist}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    wishlisted ? 'text-signal-red' : 'text-steel hover:text-pure-white'
                  )}
                  title="Add to wishlist"
                >
                  <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
                </button>
                <button
                  onClick={handleCompare}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded transition-colors',
                    compared ? 'text-signal-red' : 'text-steel hover:text-pure-white'
                  )}
                  title="Compare"
                >
                  <Scale className="h-4 w-4" />
                </button>
                <button
                  onClick={handleShare}
                  className="flex h-8 w-8 items-center justify-center rounded text-steel hover:text-pure-white transition-colors"
                  title="Share"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="shrink-0 border-iron text-pure-white hover:bg-white/5 hover:border-pure-white rounded-[6px] px-5 py-2 text-xs font-medium uppercase tracking-wider"
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
    <div className="group overflow-hidden rounded-[10px] border border-iron bg-carbon transition-all duration-300 hover:border-steel/30 flex flex-col h-full">
      <Link href={`/vehicles/${vehicle.slug}`} className="relative block shrink-0 overflow-hidden">
        <div className="aspect-[16/10] bg-deep-carbon flex items-center justify-center text-steel text-sm relative">
          {vehicle.imageUrl ? (
            <Image
              src={vehicle.imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              unoptimized
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <Camera className="h-8 w-8 opacity-20" />
              <span className="text-xs uppercase tracking-wider">No Photo</span>
            </div>
          )}
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1 items-start z-20">
          {vehicle.isFeatured && (
            <span className="badge-auction">Featured</span>
          )}
          {vehicle.recentlyAdded && (
            <span className="badge-available">New</span>
          )}
        </div>
        {vehicle.isReserved && (
          <span className="absolute right-2 top-2 badge-sold">Reserved</span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {vehicle.stockId && (
              <span className="font-mono bg-iron/50 px-1.5 py-0.5 rounded text-[10px] text-steel uppercase">{vehicle.stockId}</span>
            )}
          </div>
          <span className={cn(
            "text-[11px] font-medium uppercase tracking-wider",
            vehicle.condition.includes('Grade S') ? "text-auction-amber" : "text-ash"
          )}>{vehicle.condition}</span>
        </div>

        <Link href={`/vehicles/${vehicle.slug}`} className="group/title">
          <h3 className="font-[Oswald] text-base font-bold uppercase tracking-[0.3px] text-pure-white line-clamp-1 group-hover/title:text-signal-red transition-colors" title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-[10px] leading-none text-[#6E6E6E] mt-2 mb-3 flex-wrap">
          <Gauge className="h-3 w-3 shrink-0 text-[#5A5A5A]" />
          <span className="tabular-nums">{formatMileage(vehicle.mileage)} km</span>
          <span className="text-[#2A2A2A]">·</span>
          <Fuel className="h-3 w-3 shrink-0 text-[#5A5A5A]" />
          <span>{vehicle.fuelType}</span>
          <span className="text-[#2A2A2A]">·</span>
          <Calendar className="h-3 w-3 shrink-0 text-[#5A5A5A]" />
          <span>{vehicle.year}</span>
          <span className="text-[#2A2A2A]">·</span>
          <MapPin className="h-3 w-3 shrink-0 text-[#5A5A5A]" />
          <span className="truncate">{vehicle.location}</span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-iron pt-3">
          <div>
            <p className="price-tag text-lg">{priceFormatted}</p>
            {vehicle.fobPrice && <span className="text-[10px] uppercase font-medium text-steel tracking-wider">FOB</span>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleWishlist}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded transition-colors',
                wishlisted ? 'text-signal-red' : 'text-steel hover:text-pure-white'
              )}
              title="Add to wishlist"
            >
              <Heart className={cn('h-4 w-4', wishlisted && 'fill-current')} />
            </button>
            <button
              onClick={handleCompare}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded transition-colors',
                compared ? 'text-signal-red' : 'text-steel hover:text-pure-white'
              )}
              title="Compare"
            >
              <Scale className="h-4 w-4" />
            </button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 border-iron text-pure-white hover:bg-white/5 hover:border-pure-white rounded-[6px] px-3 text-[11px] font-medium uppercase tracking-wider"
            >
              <Link href={`/vehicles/${vehicle.slug}`}>Details</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
