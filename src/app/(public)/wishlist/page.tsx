'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Trash2, ArrowLeft, Scale, MapPin, Gauge, Fuel, Cog } from 'lucide-react';
import { VehicleCardData } from '@/components/marketplace/VehicleCard';
import { SortSelect } from '@/components/marketplace/SortSelect';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';
import { useWishlistCompare } from '@/contexts/WishlistCompareContext';
import { getVehiclesByIds } from '@/server/actions/publicConversionActions';
import { useCurrency } from '@/contexts/CurrencyContext';
import Link from 'next/link';
import Image from 'next/image';

function WishlistEmpty() {
  return (
    <div className="text-center py-20">
      <Heart className="h-10 w-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
      <h2 className="text-lg font-bold text-gray-900 mb-1">No saved vehicles</h2>
      <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
        Tap the heart icon on any vehicle to save it here.
      </p>
      <Link href="/vehicles" className="inline-flex items-center gap-2 text-sm font-medium text-[#E5231B] hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Browse vehicles
      </Link>
    </div>
  );
}

function VehicleCard({ vehicle, onRemove }: { vehicle: VehicleCardData; onRemove: () => void }) {
  const { formatConvertedPrice } = useCurrency();

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="relative aspect-[16/10] bg-gray-100">
        {vehicle.imageUrl ? (
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">No photo</div>
        )}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-md bg-black/50 p-1.5 text-white/80 hover:bg-[#E5231B] hover:text-white transition-colors z-10"
          title="Remove from wishlist"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        {vehicle.stockId && (
          <span className="absolute top-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {vehicle.stockId}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        {vehicle.bodyType && (
          <span className="inline-block w-fit rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {vehicle.bodyType}
          </span>
        )}
        <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-[#E5231B] transition-colors">
          <h3 className="font-[Oswald] font-bold text-sm uppercase tracking-wide text-gray-900 line-clamp-1">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          {vehicle.mileage > 0 && <span>{vehicle.mileage.toLocaleString()} km</span>}
          {vehicle.fuelType && <span>{vehicle.fuelType}</span>}
          {vehicle.transmission && <span>{vehicle.transmission}</span>}
          {vehicle.location && <span>{vehicle.location}</span>}
        </div>
        <div className="mt-auto pt-3 border-t border-gray-100 mt-3 flex items-center justify-between">
          <p className="font-[Oswald] text-lg font-bold text-gray-900">{formatConvertedPrice(vehicle.price, vehicle.currency)}</p>
          <Link
            href={`/vehicles/${vehicle.slug}`}
            className="text-[10px] font-semibold uppercase tracking-wider text-[#E5231B] hover:underline"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { wishlistIds, compareIds, removeFromWishlist, clearWishlist } = useWishlistCompare();
  const [sort, setSort] = useState('price-asc');
  const [vehicles, setVehicles] = useState<VehicleCardData[]>([]);
  const [loading, setLoading] = useState(false);

  const ids = React.useMemo(() => Array.from(wishlistIds), [wishlistIds]);

  const fetchVehicles = useCallback(async () => {
    if (ids.length === 0) { setVehicles([]); return; }
    setLoading(true);
    try {
      const data = await getVehiclesByIds(ids);
      setVehicles(data as VehicleCardData[]);
    } catch { setVehicles([]); } finally { setLoading(false); }
  }, [ids]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    const handle = () => { if (document.visibilityState === 'visible') fetchVehicles(); };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [fetchVehicles]);

  const sortedVehicles = React.useMemo(() => {
    const list = [...vehicles];
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'newest') list.sort((a, b) => b.year - a.year);
    return list;
  }, [vehicles, sort]);

  const avgPrice = vehicles.length > 0 ? Math.round(vehicles.reduce((s, v) => s + v.price, 0) / vehicles.length) : 0;
  const minPrice = vehicles.length > 0 ? Math.min(...vehicles.map((v) => v.price)) : 0;
  const maxPrice = vehicles.length > 0 ? Math.max(...vehicles.map((v) => v.price)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <SectionWrapper className="py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/vehicles" className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {vehicles.length > 0
                  ? `${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''} saved`
                  : 'No saved vehicles'}
              </p>
            </div>
          </div>
          {vehicles.length > 0 && (
            <div className="flex items-center gap-2">
              <SortSelect onChange={setSort} className="w-[160px] sm:w-[180px]" />
              <button
                onClick={() => { if (window.confirm('Clear your entire wishlist?')) clearWishlist(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:text-[#E5231B] hover:border-[#E5231B]/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {vehicles.length === 0 && !loading ? (
          <WishlistEmpty />
        ) : (
          <>
            {/* Stats */}
            {vehicles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Saved</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">{vehicles.length}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Avg Price</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">${avgPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Lowest</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">${minPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Highest</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">${maxPrice.toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Compare link */}
            {compareIds.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 mb-8">
                <span className="text-sm text-gray-600">
                  {compareIds.length} vehicle{compareIds.length !== 1 ? 's' : ''} for comparison
                </span>
                <Link href={`/compare?ids=${compareIds.join(',')}`} className="text-sm font-medium text-[#E5231B] hover:underline">
                  Compare
                </Link>
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onRemove={() => removeFromWishlist(vehicle.id)}
                />
              ))}
            </div>
          </>
        )}
      </SectionWrapper>
    </div>
  );
}
