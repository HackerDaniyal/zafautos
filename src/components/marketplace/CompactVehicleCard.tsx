import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { formatMileage, vehiclePlaceholderImage } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Camera, MapPin, Gauge, Fuel, Cog, Heart, Scale } from 'lucide-react';

interface CompactVehicleCardProps {
  vehicle: VehicleCardData;
  className?: string;
}

function StatusBadge({ vehicle }: { vehicle: VehicleCardData }) {
  if (vehicle.isReserved) {
    return (
      <span className="absolute top-2 left-2 z-10 rounded-[3px] bg-amber-100 px-1.5 py-[3px] text-[8px] font-bold uppercase tracking-[0.08em] text-amber-700">
        Reserved
      </span>
    );
  }
  if (vehicle.recentlyAdded) {
    return (
      <span className="absolute top-2 left-2 z-10 rounded-[3px] bg-emerald-100 px-1.5 py-[3px] text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-700">
        New
      </span>
    );
  }
  return null;
}

export function CompactVehicleCard({ vehicle, className }: CompactVehicleCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = vehicle.imageUrl && !imgError;
  const placeholder = vehiclePlaceholderImage(vehicle.make, vehicle.model, vehicle.year);
  const { formatConvertedPrice } = useCurrency();

  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group block h-full">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-sm',
          'transition-all duration-200 ease-out',
          'hover:-translate-y-[3px] hover:border-gray-300 hover:shadow-md',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
          <img
            src={hasImage ? vehicle.imageUrl! : placeholder}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />

          <StatusBadge vehicle={vehicle} />

          {vehicle.imageCount && vehicle.imageCount > 1 && (
            <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-[3px] bg-black/50 px-1.5 py-[2px] text-[8px] font-medium text-white backdrop-blur-sm">
              <Camera className="h-2.5 w-2.5" />
              {vehicle.imageCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3 pt-2.5">
          {/* Tags */}
          <div className="flex items-center gap-1.5 text-[8px] leading-none text-gray-400">
            {vehicle.stockId && (
              <span className="rounded bg-gray-100 px-1.5 py-[3px] font-medium tabular-nums text-gray-500">
                {vehicle.stockId}
              </span>
            )}
            {vehicle.bodyType && (
              <span className="rounded bg-gray-100 px-1.5 py-[3px] font-medium text-gray-500">
                {vehicle.bodyType}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mt-2 truncate font-[Oswald] text-[13px] font-bold uppercase leading-tight tracking-[0.03em] text-gray-900 transition-colors duration-150 group-hover:text-[#E5231B]">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>

          {/* Specs row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[9px] leading-none text-gray-400">
            {vehicle.mileage > 0 && (
              <span className="flex items-center gap-1">
                <Gauge className="h-2.5 w-2.5 shrink-0 text-gray-400" />
                <span className="tabular-nums">{formatMileage(vehicle.mileage)} km</span>
              </span>
            )}
            {vehicle.fuelType && (
              <span className="flex items-center gap-1">
                <Fuel className="h-2.5 w-2.5 shrink-0 text-gray-400" />
                <span>{vehicle.fuelType}</span>
              </span>
            )}
            {vehicle.transmission && (
              <span className="flex items-center gap-1">
                <Cog className="h-2.5 w-2.5 shrink-0 text-gray-400" />
                <span>{vehicle.transmission}</span>
              </span>
            )}
          </div>

          {/* Location */}
          {vehicle.location && (
            <div className="mt-1.5 flex items-center gap-1 text-[8px] leading-none text-gray-400">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate">{vehicle.location}</span>
            </div>
          )}

          {/* Spacer pushes bottom to bottom */}
          <div className="mt-auto" />

          {/* Price + Actions */}
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
            <span className="font-[Oswald] text-[16px] font-bold leading-none tracking-wide text-gray-900">
              {formatConvertedPrice(vehicle.price, vehicle.currency)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="flex items-center justify-center rounded bg-gray-100 p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                aria-label="Add to wishlist"
              >
                <Heart className="h-3 w-3" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                className="flex items-center justify-center rounded bg-gray-100 p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                aria-label="Compare"
              >
                <Scale className="h-3 w-3" />
              </button>
              <span className="rounded-[3px] border border-gray-200 bg-white px-2.5 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em] text-gray-500 transition-all duration-150 group-hover:border-[#E5231B]/50 group-hover:bg-[#E5231B]/5 group-hover:text-[#E5231B]">
                Details
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
