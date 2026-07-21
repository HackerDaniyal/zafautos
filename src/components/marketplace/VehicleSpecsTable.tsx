import React from 'react';
import { cn, formatMileage } from '@/lib/utils';

export interface VehicleSpecs {
  make?: string;
  model?: string;
  year?: number | string;
  bodyType?: string;
  fuelType?: string;
  transmission?: string;
  engineSize?: string;
  horsepower?: string;
  mileage?: number | string;
  color?: string;
  doors?: number | string;
  seats?: number | string;
  driveType?: string;
  condition?: string;
  location?: string;
  stockNumber?: string;
  vin?: string;
  [key: string]: string | number | undefined;
}

interface SpecRowProps {
  label: string;
  value: string | number;
}

function SpecRow({ label, value }: SpecRowProps) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-iron/30 last:border-0">
      <dt className="w-32 shrink-0 text-[11px] font-medium text-[#6E6E6E] uppercase tracking-[0.08em]">
        {label}
      </dt>
      <dd className="text-[13px] font-medium text-white">{value}</dd>
    </div>
  );
}

const SPEC_LABELS: Record<string, string> = {
  make: 'Make',
  model: 'Model',
  year: 'Year',
  bodyType: 'Body Type',
  fuelType: 'Fuel Type',
  transmission: 'Transmission',
  engineSize: 'Engine Size',
  horsepower: 'Horsepower',
  mileage: 'Mileage',
  color: 'Colour',
  doors: 'Doors',
  seats: 'Seats',
  driveType: 'Drive Type',
  condition: 'Condition',
  location: 'Location',
  stockNumber: 'Stock No.',
  vin: 'VIN',
};

interface VehicleSpecsTableProps {
  specs: VehicleSpecs;
  className?: string;
}

export function VehicleSpecsTable({ specs, className }: VehicleSpecsTableProps) {
  const entries = Object.entries(specs).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );

  if (entries.length === 0) return null;

  return (
    <section className={cn('rounded-[10px] border border-iron bg-carbon p-4', className)}>
      <h2 className="font-[Oswald] text-base font-bold uppercase tracking-wider text-pure-white mb-2">Vehicle Specifications</h2>
      <dl className="divide-y divide-iron/50">
        {entries.map(([key, value]) => (
          <SpecRow
            key={key}
            label={SPEC_LABELS[key] ?? key}
            value={
              key === 'mileage' && typeof value === 'number'
                ? `${formatMileage(value)} km`
                : String(value)
            }
          />
        ))}
      </dl>
    </section>
  );
}
