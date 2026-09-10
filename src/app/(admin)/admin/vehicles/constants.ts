import type { VehicleStatus } from './types';

export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  draft: { label: 'Draft', color: 'text-steel', bgColor: 'bg-steel/10', dotColor: 'bg-steel' },
  active: { label: 'Active', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  sold: { label: 'Sold', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
  archived: { label: 'Archived', color: 'text-ash', bgColor: 'bg-ash/10', dotColor: 'bg-ash' },
};

export const VEHICLE_STATUS_OPTIONS = Object.entries(VEHICLE_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'certified', label: 'Certified Pre-Owned' },
];

export const VEHICLE_FORM_STEPS = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'specs', label: 'Specifications' },
  { id: 'features', label: 'Features & Safety' },
  { id: 'media', label: 'Media' },
  { id: 'seo', label: 'SEO' },
  { id: 'publishing', label: 'Publishing' },
] as const;

export type VehicleFormStep = typeof VEHICLE_FORM_STEPS[number]['id'];

export const VEHICLE_DEFAULT_PAGE_SIZE = 20;
