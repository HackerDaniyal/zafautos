'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { HomepageLookupItem } from '@/lib/homepage-data';

const BODY_TYPE_IMAGES: Record<string, string> = {
  sedan: '/sedan-Photoroom.png',
  hatchback: '/hatchback-Photoroom.png',
  coupe: '/coupe-Photoroom.png',
  minivan: '/minivan-Photoroom.png',
  truck: '/truck-Photoroom.png',
  suv: '/Isolate_white_SUV_20260920125246-Photoroom.png',
  mpv: '/White_MPV_parked_20260920123535-Photoroom.png',
  convertible: '/White_convertible_car_parked_20260920123541-Photoroom.png',
  van: '/White_commercial_van_parked_20260920123553-Photoroom.png',
  wagon: '/White_wagon_car_parked_20260920123546-Photoroom.png',
  'tail wagon': '/White_station_wagon_parked_20260920123550-Photoroom.png',
  'tall wagon': '/White_wagon_parked_side_profile_20260920125638-Photoroom.png',
};

interface BodyTypeWidgetProps {
  bodyTypes: HomepageLookupItem[];
  counts?: Record<string, number>;
}

export function BodyTypeWidget({ bodyTypes, counts }: BodyTypeWidgetProps) {
  const router = useRouter();

  const navigate = useCallback(
    (name: string) => {
      router.push(`/vehicles/body-type/${encodeURIComponent(name.toLowerCase())}`);
    },
    [router],
  );

  if (bodyTypes.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Find Cars by Type</h3>
      <div className="grid grid-cols-2 gap-2 overflow-hidden">
        {bodyTypes.map((bt) => {
          const img = BODY_TYPE_IMAGES[bt.name.toLowerCase()];
          return (
            <button
              key={bt.id}
              onClick={() => navigate(bt.name)}
              className="group/bt flex flex-col items-center rounded-lg border border-gray-100 p-2 transition-all hover:border-[#E5231B]/30 hover:shadow-sm"
            >
              <div className="flex h-14 w-full items-center justify-center overflow-visible">
                {img ? (
                  <img
                    src={img}
                    alt={bt.name}
                    className="h-12 w-full object-contain transition-all duration-200 ease-out group-hover/bt:scale-[1.35] group-hover/bt:drop-shadow-lg group-hover/bt:-translate-y-1"
                  />
                ) : (
                  <span className="text-[10px] font-medium text-gray-400">{bt.name.slice(0, 4)}</span>
                )}
              </div>
              <span className="mt-1.5 w-full text-center text-[11px] font-semibold text-gray-700 group-hover/bt:text-[#E5231B] transition-colors leading-tight">
                {bt.name}
              </span>
              {counts && counts[bt.name] !== undefined && (
                <span className="text-[10px] text-gray-400 leading-none mt-0.5">{counts[bt.name]} cars</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
