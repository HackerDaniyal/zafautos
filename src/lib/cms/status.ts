export type StatusConfig = {
  label: string;
  color: string;
  bgColor: string;
  dotColor: string;
};

type StatusMap = Record<string, StatusConfig>;

const VEHICLE_STATUSES: StatusMap = {
  draft: {
    label: 'Draft',
    color: 'text-ash',
    bgColor: 'bg-ash/10',
    dotColor: 'bg-ash',
  },
  available: {
    label: 'Available',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    dotColor: 'bg-green-400',
  },
  reserved: {
    label: 'Reserved',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    dotColor: 'bg-amber-400',
  },
  sold: {
    label: 'Sold',
    color: 'text-signal-red',
    bgColor: 'bg-signal-red/10',
    dotColor: 'bg-signal-red',
  },
  in_transit: {
    label: 'In Transit',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    dotColor: 'bg-blue-400',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    dotColor: 'bg-green-400',
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    dotColor: 'bg-orange-400',
  },
};

const ORDER_STATUSES: StatusMap = {
  pending: {
    label: 'Pending',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    dotColor: 'bg-amber-400',
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    dotColor: 'bg-blue-400',
  },
  processing: {
    label: 'Processing',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    dotColor: 'bg-purple-400',
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-400/10',
    dotColor: 'bg-indigo-400',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    dotColor: 'bg-green-400',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-signal-red',
    bgColor: 'bg-signal-red/10',
    dotColor: 'bg-signal-red',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-ash',
    bgColor: 'bg-ash/10',
    dotColor: 'bg-ash',
  },
};

const PAYMENT_STATUSES: StatusMap = {
  pending: {
    label: 'Pending',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    dotColor: 'bg-amber-400',
  },
  paid: {
    label: 'Paid',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    dotColor: 'bg-green-400',
  },
  failed: {
    label: 'Failed',
    color: 'text-signal-red',
    bgColor: 'bg-signal-red/10',
    dotColor: 'bg-signal-red',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-ash',
    bgColor: 'bg-ash/10',
    dotColor: 'bg-ash',
  },
  partial: {
    label: 'Partial',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    dotColor: 'bg-orange-400',
  },
};

const USER_STATUSES: StatusMap = {
  active: {
    label: 'Active',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    dotColor: 'bg-green-400',
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    dotColor: 'bg-amber-400',
  },
  suspended: {
    label: 'Suspended',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    dotColor: 'bg-orange-400',
  },
  blocked: {
    label: 'Blocked',
    color: 'text-signal-red',
    bgColor: 'bg-signal-red/10',
    dotColor: 'bg-signal-red',
  },
};

const ALL_STATUSES: StatusMap = {
  ...VEHICLE_STATUSES,
  ...ORDER_STATUSES,
  ...PAYMENT_STATUSES,
  ...USER_STATUSES,
};

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const FALLBACK: StatusConfig = {
  label: '',
  color: 'text-ash',
  bgColor: 'bg-ash/10',
  dotColor: 'bg-ash',
};

/**
 * Returns the display configuration for a status string.
 */
export function getStatusConfig(status: string): StatusConfig {
  const config = ALL_STATUSES[status];
  if (config) return config;
  return { ...FALLBACK, label: formatStatusLabel(status) };
}

/**
 * Returns the human-readable label for a status.
 */
export function getStatusLabel(status: string): string {
  return getStatusConfig(status).label;
}

/**
 * Returns the text color class for a status.
 */
export function getStatusColor(status: string): string {
  return getStatusConfig(status).color;
}
