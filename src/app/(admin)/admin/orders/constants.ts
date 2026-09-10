import type { OrderStatus } from './types';
import { PAYMENT_STATUS_CONFIG, PAYMENT_STATUS_OPTIONS } from '@/app/(admin)/admin/payments/constants';

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending: { label: 'Pending', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  confirmed: { label: 'Confirmed', color: 'text-blue-400', bgColor: 'bg-blue-400/10', dotColor: 'bg-blue-400' },
  processing: { label: 'Processing', color: 'text-purple-400', bgColor: 'bg-purple-400/10', dotColor: 'bg-purple-400' },
  shipped: { label: 'Shipped', color: 'text-indigo-400', bgColor: 'bg-indigo-400/10', dotColor: 'bg-indigo-400' },
  delivered: { label: 'Delivered', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  cancelled: { label: 'Cancelled', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export { PAYMENT_STATUS_CONFIG, PAYMENT_STATUS_OPTIONS };

export const SHIPPING_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending: { label: 'Pending', color: 'text-steel', bgColor: 'bg-steel/10', dotColor: 'bg-steel' },
  in_transit: { label: 'In Transit', color: 'text-blue-400', bgColor: 'bg-blue-400/10', dotColor: 'bg-blue-400' },
  delivered: { label: 'Delivered', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  delayed: { label: 'Delayed', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  cancelled: { label: 'Cancelled', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
};

export const SHIPPING_STATUS_OPTIONS = Object.entries(SHIPPING_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const ORDER_PAGE_SIZES = [10, 20, 50, 100];
export const ORDER_DEFAULT_PAGE_SIZE = 20;

export const ORDER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'customer', label: 'Customer' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'payment', label: 'Payment' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
] as const;

export type OrderTab = typeof ORDER_TABS[number]['id'];
