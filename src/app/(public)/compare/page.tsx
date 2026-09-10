'use client';

import React, { useState, useCallback } from 'react';
import { Scale, X, Trash2, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';
import { type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { searchVehiclesForCompare } from '@/server/actions/publicConversionActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type CompareVehicle = VehicleCardData;

const SPEC_KEYS: { label: string; key: keyof VehicleCardData; format?: (v: string | number | boolean | undefined) => string }[] = [
  { label: 'Year', key: 'year' },
  { label: 'Body Type', key: 'bodyType' },
  { label: 'Fuel Type', key: 'fuelType' },
  { label: 'Transmission', key: 'transmission' },
  {
    label: 'Mileage',
    key: 'mileage',
    format: (v) => (typeof v === 'number' ? `${v.toLocaleString()} km` : String(v)),
  },
  {
    label: 'Price',
    key: 'price',
    format: (v) => (typeof v === 'number' ? `$${v.toLocaleString()}` : String(v)),
  },
  { label: 'Location', key: 'location' },
  { label: 'Condition', key: 'condition' },
];

interface VehiclePickerProps {
  onSelect: (vehicle: CompareVehicle) => void;
  excluded: string[];
}

function VehiclePicker({ onSelect, excluded }: VehiclePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompareVehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const vehicles = await searchVehiclesForCompare(q, excluded);
      setResults(vehicles);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [excluded]);

  const handleOpen = () => {
    setOpen(true);
    search('');
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    search(value);
  };

  return (
    <div className="relative h-full flex flex-col">
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200/40 bg-gray-50/30',
          'min-h-[220px] text-gray-500 hover:border-signal-red/40 hover:bg-signal-red/5 hover:text-gray-900 transition-all duration-200',
        )}
        aria-label="Add vehicle to compare"
      >
        <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
          <Scale className="h-5 w-5" />
        </div>
        <span className="font-[Oswald] font-bold text-sm uppercase tracking-wider">Add Vehicle</span>
      </button>

      {open && (
        <div className="absolute top-0 left-0 right-0 z-50 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-200/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search vehicles to compare…"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-steel/50"
              />
            </div>
          </div>
          <ul className="max-h-[300px] overflow-y-auto">
            {loading && (
              <li className="p-4 text-sm text-center text-gray-500">Searching…</li>
            )}
            {!loading && results.length === 0 && (
              <li className="p-4 text-sm text-center text-gray-500">No matching vehicles found</li>
            )}
            {!loading && results.map((v) => (
              <li key={v.id} className="border-b border-gray-200/30 last:border-0">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-100 transition-colors group text-left"
                  onClick={() => { onSelect(v); setOpen(false); setQuery(''); }}
                >
                  <div className="relative h-10 w-14 shrink-0 rounded overflow-hidden bg-gray-50 border border-gray-200">
                    {v.imageUrl && <Image src={v.imageUrl} alt="" fill className="object-cover" sizes="56px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium truncate text-gray-900 group-hover:text-signal-red transition-colors">{v.year} {v.make} {v.model}</span>
                    <span className="block text-xs text-gray-500 font-semibold mt-0.5">${v.price.toLocaleString()}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t border-gray-200/50">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="w-full text-gray-500 hover:text-gray-900">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CompareColumnProps {
  vehicle: CompareVehicle;
  onRemove: () => void;
}

function CompareColumn({ vehicle, onRemove }: CompareColumnProps) {
  return (
    <div className="flex flex-col gap-3 h-full group relative">
      <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden h-full flex flex-col">
        <div className="relative aspect-[4/3] bg-gray-50 w-full shrink-0">
          {vehicle.imageUrl ? (
            <Image src={vehicle.imageUrl} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-500">No photo</div>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove from compare"
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-gray-500 hover:bg-signal-red hover:text-gray-900 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between gap-2">
          <div>
            {vehicle.isFeatured && <Badge className="mb-2 text-[10px] uppercase font-bold tracking-wider bg-signal-red hover:bg-deep-red">Featured</Badge>}
            <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-signal-red transition-colors block">
              <h3 className="font-[Oswald] font-bold text-sm uppercase tracking-wider text-gray-900 line-clamp-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
            </Link>
          </div>
          <div className="pt-2 border-t border-gray-200/50 mt-auto">
            <p className="text-lg font-[Oswald] font-bold text-gray-900">${vehicle.price.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const MAX_COMPARE = 4;

export default function ComparePage() {
  const [selected, setSelected] = useState<CompareVehicle[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [highlightDiff, setHighlightDiff] = useState(true);

  const addVehicle = (v: CompareVehicle) => {
    if (selected.length < MAX_COMPARE) setSelected((prev) => [...prev, v]);
  };

  const removeVehicle = (id: string) => {
    setSelected((prev) => prev.filter((v) => v.id !== id));
  };

  const clearAll = () => setSelected([]);

  const displayedSpecs = showAll ? SPEC_KEYS : SPEC_KEYS.slice(0, 5);
  const emptySlots = Math.max(0, 2 - selected.length);

  return (
    <SectionWrapper className="space-y-8 pb-20 pt-6 md:pt-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <PageHeader
          title="Compare Vehicles"
          description={`Select up to ${MAX_COMPARE} vehicles to compare side by side and find the perfect match.`}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {selected.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHighlightDiff(!highlightDiff)}
                className={cn("text-sm font-medium transition-colors border-gray-200", highlightDiff ? "bg-signal-red/10 border-signal-red/30 text-signal-red" : "text-gray-500 hover:text-gray-900")}
              >
                {highlightDiff ? <Check className="mr-1.5 h-4 w-4" /> : null}
                Highlight Differences
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={clearAll} className="flex items-center gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4" /> Clear All
            </Button>
          </div>
        )}
      </div>

      <div className="relative">
        <div
          className="grid gap-4 md:gap-6"
          style={{ gridTemplateColumns: `repeat(${Math.max(2, selected.length + (selected.length < MAX_COMPARE ? 1 : 0))}, minmax(0, 1fr))` }}
        >
          {selected.map((v) => (
            <CompareColumn key={v.id} vehicle={v} onRemove={() => removeVehicle(v.id)} />
          ))}

          {selected.length < MAX_COMPARE && (
            <div className="h-full">
              <VehiclePicker onSelect={addVehicle} excluded={selected.map((v) => v.id)} />
            </div>
          )}

          {emptySlots > 1 && selected.length === 1 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200/20 bg-gray-50/20 min-h-[220px]" />
          )}
        </div>

        {selected.length >= 2 && (
          <div className="mt-8 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {displayedSpecs.map(({ label, key, format }) => {
                    const values = selected.map((v) => v[key]);
                    const allSame = values.every((val) => val === values[0]);
                    const shouldHighlight = highlightDiff && !allSame;

                    return (
                      <tr key={String(key)} className="group border-b border-gray-200/30 last:border-0 hover:bg-gray-100">
                        <th className="py-4 px-4 sm:px-6 font-semibold text-gray-500 w-1/4 min-w-[140px] bg-gray-50 align-middle text-[11px] uppercase tracking-wider">
                          {label}
                        </th>
                        {selected.map((v) => {
                          const raw = v[key];
                          const display = format ? format(Array.isArray(raw) ? raw.join(', ') : (raw ?? '')) : String(raw ?? '—');
                          return (
                            <td
                              key={v.id}
                              className={cn(
                                'py-4 px-4 sm:px-6 font-medium text-gray-900 align-middle',
                                shouldHighlight && 'bg-signal-red/5 text-signal-red'
                              )}
                              style={{ width: `${75 / selected.length}%` }}
                            >
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {SPEC_KEYS.length > 5 && (
              <div className="flex justify-center border-t border-gray-200/30 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll((v) => !v)}
                  className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900"
                >
                  {showAll ? <><ChevronUp className="mr-1.5 h-4 w-4" /> Show Less Specs</> : <><ChevronDown className="mr-1.5 h-4 w-4" /> Show All Specs</>}
                </Button>
              </div>
            )}
          </div>
        )}

        {selected.length < 2 && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 py-16 px-4 text-center rounded-xl border border-dashed border-gray-200/30 bg-gray-50/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border border-gray-200">
              <Scale className="h-8 w-8 text-gray-500/30" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-[Oswald] font-bold text-lg uppercase tracking-wider text-gray-900">Not enough vehicles</h3>
              <p className="text-sm text-gray-500">Add at least 2 vehicles to see a side-by-side comparison of their features and specifications.</p>
            </div>
            <Button asChild className="mt-2 bg-signal-red hover:bg-deep-red text-gray-900 font-[Oswald] uppercase tracking-wider">
              <Link href="/vehicles">Browse Marketplace</Link>
            </Button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
