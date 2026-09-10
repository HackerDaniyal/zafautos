import type { DealerStatus } from '@/lib/types/dealer';

export const DEALER_STATUS_CONFIG: Record<DealerStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  active: { label: 'Active', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  pending: { label: 'Pending', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  suspended: { label: 'Suspended', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
  archived: { label: 'Archived', color: 'text-steel', bgColor: 'bg-steel/10', dotColor: 'bg-steel' },
};

export const DEALER_STATUS_OPTIONS = Object.entries(DEALER_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const DEALER_PAGE_SIZES = [10, 20, 50, 100];
export const DEALER_DEFAULT_PAGE_SIZE = 20;

export const DEALER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'shipments', label: 'Shipments' },
  { id: 'documents', label: 'Documents' },
  { id: 'activity', label: 'Activity' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'audit', label: 'Audit Log' },
] as const;

export type DealerTab = typeof DEALER_TABS[number]['id'];
