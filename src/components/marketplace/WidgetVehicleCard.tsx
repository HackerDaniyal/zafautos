import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { vehiclePlaceholderImage } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

interface WidgetVehicleCardProps {
  vehicle: VehicleCardData;
  className?: string;
}

export function WidgetVehicleCard({ vehicle, className }: WidgetVehicleCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = vehicle.imageUrl && !imgError;
  const placeholder = vehiclePlaceholderImage(vehicle.make, vehicle.model, vehicle.year);
  const { formatConvertedPrice } = useCurrency();

  function buildWhatsAppUrl(): string {
    const priceStr = formatConvertedPrice(vehicle.price, vehicle.currency);
    const msg = `Hi ZafAutos,\n\nI'm interested in this vehicle:\n${vehicle.year} ${vehicle.make} ${vehicle.model}\nFOB Price: ${priceStr}\n\nPlease share more details.`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden',
        'transition-all duration-200 ease-out',
        'hover:border-gray-300 hover:shadow-md',
        className
      )}
    >
      <Link href={`/vehicles/${vehicle.slug}`} className="group block relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={hasImage ? vehicle.imageUrl! : placeholder}
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="p-2.5">
        <Link href={`/vehicles/${vehicle.slug}`} className="group block min-w-0">
          <span className="text-[10px] font-medium text-gray-400 tabular-nums">{vehicle.year}</span>
          <h3 className="mt-px text-xs font-semibold leading-snug text-gray-900 group-hover:text-[#E5231B] transition-colors">
            {vehicle.make} {vehicle.model}
          </h3>
        </Link>

        <span className="mt-1.5 block text-[8px] font-medium uppercase tracking-wider text-gray-400">FOB</span>
        <span className="text-xs font-bold text-[#E5231B] leading-none tabular-nums">
          {formatConvertedPrice(vehicle.price, vehicle.currency)}
        </span>

        <div className="mt-2 flex items-center gap-1">
          <Link
            href={`/vehicles/${vehicle.slug}`}
            className="flex-1 rounded bg-gray-100 py-1 text-center text-[9px] font-semibold text-gray-600 transition-colors hover:bg-[#E5231B] hover:text-white whitespace-nowrap"
          >
            View
          </Link>
          <a
            href={buildWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Contact about ${vehicle.year} ${vehicle.make} ${vehicle.model} on WhatsApp`}
            className="flex shrink-0 items-center justify-center rounded bg-emerald-500 p-1 text-white transition-colors hover:bg-emerald-600"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
