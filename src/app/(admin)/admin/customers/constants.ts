import type { CustomerStatus } from '@/lib/types/customer';

export const CUSTOMER_STATUS_CONFIG: Record<CustomerStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  active: { label: 'Active', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  pending: { label: 'Pending', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  suspended: { label: 'Suspended', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
  blocked: { label: 'Blocked', color: 'text-steel', bgColor: 'bg-steel/10', dotColor: 'bg-steel' },
};

export const CUSTOMER_STATUS_OPTIONS = Object.entries(CUSTOMER_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const CUSTOMER_PAGE_SIZES = [10, 20, 50, 100];
export const CUSTOMER_DEFAULT_PAGE_SIZE = 20;

export const CUSTOMER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'shipments', label: 'Shipments' },
  { id: 'wishlist', label: 'Wishlist' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'audit', label: 'Audit Log' },
] as const;

export type CustomerTab = typeof CUSTOMER_TABS[number]['id'];
