'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Scale, X, Trash2, ChevronDown, ChevronUp, Check, Search, ArrowLeft, MapPin, Gauge, Fuel, Cog } from 'lucide-react';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { searchVehiclesForCompare, getVehiclesByIds } from '@/server/actions/publicConversionActions';
import { useWishlistCompare } from '@/contexts/WishlistCompareContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { SectionWrapper } from '@/components/layout/ResponsiveLayout';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type CompareVehicle = VehicleCardData;

const SPEC_KEYS: { label: string; key: keyof VehicleCardData; format?: (v: string | number | boolean | undefined) => string }[] = [
  { label: 'Year', key: 'year' },
  { label: 'Body Type', key: 'bodyType' },
  { label: 'Fuel Type', key: 'fuelType' },
  { label: 'Transmission', key: 'transmission' },
  { label: 'Mileage', key: 'mileage', format: (v) => (typeof v === 'number' ? `${v.toLocaleString()} km` : String(v)) },
  { label: 'Price', key: 'price', format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : String(v)) },
  { label: 'Location', key: 'location' },
  { label: 'Condition', key: 'condition' },
];

function VehiclePicker({ onSelect, excluded }: { onSelect: (v: CompareVehicle) => void; excluded: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompareVehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const vehicles = await searchVehiclesForCompare(q, excluded);
      setResults(vehicles);
    } catch { setResults([]); } finally { setLoading(false); }
  }, [excluded]);

  const handleOpen = () => { setOpen(true); search(''); };
  const handleQueryChange = (v: string) => { setQuery(v); search(v); };

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full h-full min-h-[300px] flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#E5231B]/40 hover:text-[#E5231B] transition-colors"
      >
        <Scale className="h-8 w-8" strokeWidth={1.5} />
        <span className="text-sm font-semibold uppercase tracking-wider">Add Vehicle</span>
      </button>

      {open && (
        <div className="absolute inset-0 z-50 rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-gray-200 bg-gray-50 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#E5231B]/40"
              />
            </div>
          </div>
          <ul className="max-h-[300px] overflow-y-auto">
            {loading && <li className="p-4 text-sm text-center text-gray-400">Searching...</li>}
            {!loading && results.length === 0 && <li className="p-4 text-sm text-center text-gray-400">No vehicles found</li>}
            {!loading && results.map((v) => (
              <li key={v.id} className="border-b border-gray-100 last:border-0">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left"
                  onClick={() => { onSelect(v); setOpen(false); setQuery(''); }}
                >
                  <div className="relative h-10 w-14 shrink-0 rounded overflow-hidden bg-gray-100">
                    {v.imageUrl && <Image src={v.imageUrl} alt="" fill className="object-cover" sizes="56px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium truncate text-gray-900">{v.year} {v.make} {v.model}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">${v.price.toLocaleString()}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="w-full text-gray-500 hover:text-gray-900">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CompareColumn({ vehicle, onRemove }: { vehicle: CompareVehicle; onRemove: () => void }) {
  const { formatConvertedPrice } = useCurrency();

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="relative aspect-[4/3] bg-gray-100">
        {vehicle.imageUrl ? (
          <Image src={vehicle.imageUrl} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">No photo</div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-md bg-black/50 p-1.5 text-white/80 hover:bg-[#E5231B] hover:text-white transition-colors z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        {vehicle.bodyType && (
          <span className="inline-block w-fit rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {vehicle.bodyType}
          </span>
        )}
        <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-[#E5231B] transition-colors">
          <h3 className="font-[Oswald] font-bold text-sm uppercase tracking-wide text-gray-900 line-clamp-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
          {vehicle.mileage > 0 && <span>{vehicle.mileage.toLocaleString()} km</span>}
          {vehicle.fuelType && <span>{vehicle.fuelType}</span>}
          {vehicle.transmission && <span>{vehicle.transmission}</span>}
          {vehicle.location && <span>{vehicle.location}</span>}
        </div>
        <div className="mt-auto pt-3 border-t border-gray-100 mt-3">
          <p className="font-[Oswald] text-lg font-bold text-gray-900">{formatConvertedPrice(vehicle.price, vehicle.currency)}</p>
        </div>
      </div>
    </div>
  );
}

const MAX_COMPARE = 4;

export default function ComparePage() {
  const { compareIds, toggleCompare } = useWishlistCompare();
  const [selected, setSelected] = useState<CompareVehicle[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);

  useEffect(() => {
    if (compareIds.length > 0) {
      getVehiclesByIds(compareIds).then((data) => setSelected(data as CompareVehicle[]));
    } else {
      setSelected([]);
    }
  }, [compareIds]);

  const addVehicle = (v: CompareVehicle) => {
    if (selected.length < MAX_COMPARE) {
      setSelected((prev) => [...prev, v]);
      toggleCompare(v.id);
    }
  };

  const removeVehicle = (id: string) => {
    setSelected((prev) => prev.filter((v) => v.id !== id));
    toggleCompare(id);
  };

  const clearAll = () => {
    selected.forEach((v) => toggleCompare(v.id));
    setSelected([]);
  };

  const displayedSpecs = showAll ? SPEC_KEYS : SPEC_KEYS.slice(0, 5);

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
              <h1 className="text-xl font-bold text-gray-900">Compare Vehicles</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {selected.length > 0
                  ? `${selected.length} of ${MAX_COMPARE} vehicles`
                  : 'Add at least 2 vehicles to compare'}
              </p>
            </div>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              {selected.length > 1 && (
                <button
                  onClick={() => setHighlightDiff(!highlightDiff)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                    highlightDiff
                      ? "bg-[#E5231B]/10 border-[#E5231B]/20 text-[#E5231B]"
                      : "border-gray-200 bg-white text-gray-500 hover:text-gray-900"
                  )}
                >
                  {highlightDiff && <Check className="h-3.5 w-3.5" />}
                  Differences
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-500 hover:text-[#E5231B] hover:border-[#E5231B]/30 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Vehicle Cards */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          {selected.map((v) => (
            <CompareColumn key={v.id} vehicle={v} onRemove={() => removeVehicle(v.id)} />
          ))}
          {selected.length < MAX_COMPARE && selected.length < 2 && (
            <VehiclePicker onSelect={addVehicle} excluded={selected.map((v) => v.id)} />
          )}
        </div>

        {/* Comparison Table */}
        {selected.length >= 2 && (
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 w-40">Spec</th>
                  {selected.map((v) => (
                    <th key={v.id} className="text-left py-3 px-5 text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      {v.year} {v.make}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedSpecs.map(({ label, key, format }) => {
                  const values = selected.map((v) => v[key]);
                  const allSame = values.every((val) => val === values[0]);
                  const isDiff = highlightDiff && !allSame;

                  return (
                    <tr key={String(key)} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-5 text-xs font-medium text-gray-400 uppercase tracking-wider bg-gray-50">{label}</td>
                      {selected.map((v) => {
                        const raw = v[key];
                        const display = format ? format(Array.isArray(raw) ? raw.join(', ') : (raw ?? '')) : String(raw ?? '—');
                        return (
                          <td key={v.id} className={cn('py-3 px-5 font-medium text-gray-900', isDiff && 'text-[#E5231B] bg-[#E5231B]/5')}>
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {SPEC_KEYS.length > 5 && (
              <div className="border-t border-gray-100 py-2 text-center">
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
                >
                  {showAll ? <><ChevronUp className="inline h-3.5 w-3.5 mr-1" /> Less</> : <><ChevronDown className="inline h-3.5 w-3.5 mr-1" /> All specs</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {selected.length < 2 && selected.length > 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">Add one more vehicle to start comparing</p>
        )}
        {selected.length === 0 && (
          <div className="text-center py-16">
            <Scale className="h-10 w-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-sm text-gray-500 mb-4">No vehicles to compare yet</p>
            <Link href="/vehicles" className="inline-flex items-center gap-2 text-sm font-medium text-[#E5231B] hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Browse vehicles
            </Link>
          </div>
        )}
      </SectionWrapper>
    </div>
  );
}
