import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { formatMileage, formatPrice, vehiclePlaceholderImage } from '@/lib/utils';
import { Camera, MapPin, Gauge, Fuel, Calendar, ArrowRightLeft } from 'lucide-react';

interface CompactVehicleCardProps {
  vehicle: VehicleCardData;
  className?: string;
}

function StatusBadge({ vehicle }: { vehicle: VehicleCardData }) {
  if (vehicle.isReserved) {
    return (
      <span className="absolute top-2 left-2 z-10 rounded-[3px] bg-[#D89A2E]/25 px-1.5 py-[3px] font-[Inter] text-[8px] font-bold uppercase tracking-[0.08em] text-[#D89A2E] backdrop-blur-md">
        Reserved
      </span>
    );
  }
  if (vehicle.recentlyAdded) {
    return (
      <span className="absolute top-2 left-2 z-10 rounded-[3px] bg-[#3BA55D]/25 px-1.5 py-[3px] font-[Inter] text-[8px] font-bold uppercase tracking-[0.08em] text-[#3BA55D] backdrop-blur-md">
        New
      </span>
    );
  }
  return null;
}

export function CompactVehicleCard({ vehicle, className }: CompactVehicleCardProps) {
  return (
    <Link href={`/vehicles/${vehicle.slug}`} className="group block h-full">
      <article
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-[8px] border border-[#222222] bg-[#141414]',
          'transition-all duration-200 ease-out',
          'hover:-translate-y-[3px] hover:border-[#3D3D3D] hover:shadow-[0_6px_24px_rgba(0,0,0,0.5)]',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#0E0E0E]">
          <img
            src={vehiclePlaceholderImage(vehicle.make, vehicle.model, vehicle.year)}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

          <StatusBadge vehicle={vehicle} />

          {vehicle.imageCount && vehicle.imageCount > 0 && (
            <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-[3px] bg-black/60 px-1.5 py-[2px] text-[8px] font-medium text-white/80 backdrop-blur-sm">
              <Camera className="h-2.5 w-2.5" />
              {vehicle.imageCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-2.5 pt-2">
          {/* Title */}
          <h3 className="truncate font-[Oswald] text-[11px] font-bold uppercase leading-tight tracking-[0.04em] text-[#E8E8E8] transition-colors duration-150 group-hover:text-[#FFFFFF]">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>

          {/* Specs — single line, no wrap */}
          <div className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap text-[8.5px] leading-none text-[#6E6E6E]">
            <span className="flex items-center gap-0.5"><Gauge className="h-2 w-2 shrink-0 text-[#5A5A5A]" /><span className="tabular-nums">{formatMileage(vehicle.mileage)} km</span></span>
            <span className="flex items-center gap-0.5"><Fuel className="h-2 w-2 shrink-0 text-[#5A5A5A]" /><span>{vehicle.fuelType}</span></span>
            <span className="flex items-center gap-0.5"><Calendar className="h-2 w-2 shrink-0 text-[#5A5A5A]" /><span>{vehicle.year}</span></span>
          </div>

          {/* Location — single line, no wrap */}
          <div className="mt-1 flex items-center gap-1 whitespace-nowrap text-[8px] leading-none text-[#5A5A5A]">
            <MapPin className="h-2 w-2 shrink-0" />
            <span className="truncate">{vehicle.location}, Japan</span>
          </div>

          {/* Spacer pushes price to bottom */}
          <div className="mt-auto" />

          {/* Price + View */}
          <div className="mt-2 flex items-end justify-between border-t border-[#222222]/60 pt-2">
            <span className="font-[Oswald] text-[14px] font-bold leading-none tracking-wide text-[#E5231B]">
              {formatPrice(vehicle.price)}
            </span>
            <span className="rounded-[3px] border border-[#2A2A2A] bg-[#0E0E0E] px-2 py-[3px] text-[8px] font-bold uppercase tracking-[0.1em] text-[#5A5A5A] transition-all duration-150 group-hover:border-[#E5231B]/50 group-hover:bg-[#E5231B]/10 group-hover:text-[#E5231B]">
              View
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
