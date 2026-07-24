import type { ShipmentStatus } from '@/lib/types/shipping';

export const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending: { label: 'Pending', color: 'text-steel', bgColor: 'bg-steel/10', dotColor: 'bg-steel' },
  in_transit: { label: 'In Transit', color: 'text-blue-400', bgColor: 'bg-blue-400/10', dotColor: 'bg-blue-400' },
  delivered: { label: 'Delivered', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  delayed: { label: 'Delayed', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  cancelled: { label: 'Cancelled', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
};

export const SHIPMENT_STATUS_OPTIONS = Object.entries(SHIPMENT_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const CONTAINER_TYPE_OPTIONS = [
  { value: '20ft', label: '20ft Standard' },
  { value: '40ft', label: '40ft Standard' },
  { value: '40ft_hc', label: '40ft High Cube' },
  { value: '45ft', label: '45ft High Cube' },
  { value: 'open_top', label: 'Open Top' },
  { value: 'flat_rack', label: 'Flat Rack' },
  { value: 'reefer', label: 'Reefer' },
];

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'bill_of_lading', label: 'Bill of Lading' },
  { value: 'export_certificate', label: 'Export Certificate' },
  { value: 'inspection_report', label: 'Inspection Report' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'commercial_invoice', label: 'Commercial Invoice' },
  { value: 'packing_list', label: 'Packing List' },
  { value: 'photos', label: 'Photos' },
  { value: 'other', label: 'Other' },
];

export const SHIPMENT_PAGE_SIZES = [10, 20, 50, 100];
export const SHIPMENT_DEFAULT_PAGE_SIZE = 20;

export const SHIPMENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'orders', label: 'Orders' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'containers', label: 'Containers' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
] as const;

export type ShipmentTab = typeof SHIPMENT_TABS[number]['id'];
