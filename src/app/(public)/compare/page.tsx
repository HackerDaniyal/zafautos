'use client';

import React, { useState } from 'react';
import { Scale, X, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { placeholderVehicles, type VehicleCardData } from '@/components/marketplace/VehicleCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper, PageHeader } from '@/components/layout/ResponsiveLayout';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

type CompareVehicle = VehicleCardData;

// ─── Spec row used in comparison table ──────────────────────────────────────

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

// ─── Vehicle Picker ──────────────────────────────────────────────────────────

interface VehiclePickerProps {
  onSelect: (vehicle: CompareVehicle) => void;
  excluded: string[];
}

function VehiclePicker({ onSelect, excluded }: VehiclePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const available = React.useMemo(
    () =>
      placeholderVehicles.filter(
        (v) =>
          !excluded.includes(v.id) &&
          `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [excluded, query],
  );

  return (
    <div className="relative h-full flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/20',
          'min-h-[220px] text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-200',
        )}
        aria-label="Add vehicle to compare"
      >
        <div className="h-12 w-12 rounded-full bg-background border shadow-sm flex items-center justify-center">
          <Scale className="h-5 w-5" />
        </div>
        <span className="font-semibold text-sm">Add Vehicle</span>
      </button>

      {open && (
        <div className="absolute top-0 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-border/50 bg-muted/30">
            <input
              type="text"
              placeholder="Search vehicles to compare…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-shadow"
            />
          </div>
          <ul className="max-h-[300px] overflow-y-auto py-1 divide-y divide-border/30 custom-scrollbar">
            {available.length === 0 && (
              <li className="p-4 text-sm text-center text-muted-foreground">No matching vehicles found</li>
            )}
            {available.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors group text-left"
                  onClick={() => { onSelect(v); setOpen(false); setQuery(''); }}
                >
                  <div className="relative h-10 w-14 shrink-0 rounded overflow-hidden bg-muted border">
                    {v.imageUrl && <Image src={v.imageUrl} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium truncate group-hover:text-primary transition-colors">{v.year} {v.make} {v.model}</span>
                    <span className="block text-xs text-muted-foreground font-semibold mt-0.5">${v.price.toLocaleString()}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Compare Column Header ────────────────────────────────────────────────────

interface CompareColumnProps {
  vehicle: CompareVehicle;
  onRemove: () => void;
}

function CompareColumn({ vehicle, onRemove }: CompareColumnProps) {
  return (
    <div className="flex flex-col gap-3 h-full group relative">
      <div className="relative rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
        <div className="relative aspect-[4/3] bg-muted w-full shrink-0">
          {vehicle.imageUrl ? (
            <Image src={vehicle.imageUrl} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No photo</div>
          )}
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove from compare"
            className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 shadow-sm text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors z-10 opacity-0 group-hover:opacity-100 sm:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between gap-2">
          <div>
            {vehicle.isFeatured && <Badge className="mb-2 text-[10px] uppercase font-bold tracking-wider bg-amber-500 hover:bg-amber-600">Featured</Badge>}
            <Link href={`/vehicles/${vehicle.slug}`} className="hover:text-primary transition-colors block">
              <h3 className="font-bold text-base leading-tight line-clamp-2">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
            </Link>
          </div>
          <div className="pt-2 border-t border-border/30 mt-auto">
            <p className="text-xl font-extrabold text-primary">${vehicle.price.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
                className={cn("text-sm font-medium transition-colors", highlightDiff ? "bg-primary/10 border-primary/30 text-primary" : "")}
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

      {/* Grid Layout for Desktop vs Mobile */}
      <div className="relative">
        {/* Sticky Headers for Scroll (only visible on desktop when scrolling table, simulated here by grid structure) */}
        
        {/* Selection Grid */}
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
          
          {/* Filler empty slot for visual balance when only 1 selected */}
          {emptySlots > 1 && selected.length === 1 && (
            <div className="rounded-xl border-2 border-dashed border-border/30 bg-muted/5 min-h-[220px]" />
          )}
        </div>

        {/* Comparison Table */}
        {selected.length >= 2 && (
          <div className="mt-8 rounded-xl border border-border shadow-sm bg-card overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  {displayedSpecs.map(({ label, key, format }) => {
                    const values = selected.map((v) => v[key]);
                    const allSame = values.every((val) => val === values[0]);
                    const shouldHighlight = highlightDiff && !allSame;
                    
                    return (
                      <tr 
                        key={key} 
                        className="group border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30"
                      >
                        <th className="py-4 px-4 sm:px-6 font-semibold text-muted-foreground w-1/4 min-w-[140px] bg-muted/10 align-middle">
                          {label}
                        </th>
                        {selected.map((v) => {
                          const raw = v[key];
                          const display = format ? format(raw) : String(raw ?? '—');
                          return (
                            <td
                              key={v.id}
                              className={cn(
                                'py-4 px-4 sm:px-6 font-medium align-middle',
                                shouldHighlight && 'bg-primary/5 text-primary'
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

            {/* Show more / less */}
            {SPEC_KEYS.length > 5 && (
              <div className="flex justify-center border-t border-border bg-muted/10 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll((v) => !v)}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {showAll ? <><ChevronUp className="mr-1.5 h-4 w-4" /> Show Less Specs</> : <><ChevronDown className="mr-1.5 h-4 w-4" /> Show All Specs</>}
                </Button>
              </div>
            )}
          </div>
        )}

        {selected.length < 2 && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 py-16 px-4 text-center rounded-xl border border-dashed border-border bg-muted/10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border shadow-sm">
              <Scale className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="font-bold text-lg">Not enough vehicles</h3>
              <p className="text-sm text-muted-foreground">Add at least 2 vehicles to see a side-by-side comparison of their features and specifications.</p>
            </div>
            <Button asChild className="mt-2 shadow-sm font-semibold">
              <Link href="/vehicles">Browse Marketplace</Link>
            </Button>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}
