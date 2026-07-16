import React from 'react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-border/50 last:border-0">
      <dt className="w-full sm:w-40 text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
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
    <section className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <h2 className="text-base font-semibold mb-2">Vehicle Specifications</h2>
      <dl className="divide-y divide-border/50">
        {entries.map(([key, value]) => (
          <SpecRow
            key={key}
            label={SPEC_LABELS[key] ?? key}
            value={
              key === 'mileage' && typeof value === 'number'
                ? `${value.toLocaleString()} km`
                : String(value)
            }
          />
        ))}
      </dl>
    </section>
  );
}
