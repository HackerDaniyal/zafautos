import type { LeadStatus } from '@/server/actions/leadActions';

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  new: { label: 'New', color: 'text-blue-400', bgColor: 'bg-blue-400/10', dotColor: 'bg-blue-400' },
  contacted: { label: 'Contacted', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  qualified: { label: 'Qualified', color: 'text-purple-400', bgColor: 'bg-purple-400/10', dotColor: 'bg-purple-400' },
  negotiating: { label: 'Negotiating', color: 'text-cyan-400', bgColor: 'bg-cyan-400/10', dotColor: 'bg-cyan-400' },
  converted: { label: 'Converted', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  lost: { label: 'Lost', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
};

export const LEAD_STATUS_OPTIONS = Object.entries(LEAD_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const LEAD_SOURCE_CONFIG: Record<string, { label: string }> = {
  website: { label: 'Website' },
  whatsapp: { label: 'WhatsApp' },
  phone: { label: 'Phone' },
  email: { label: 'Email' },
  walk_in: { label: 'Walk-in' },
  other: { label: 'Other' },
};

export const LEAD_PAGE_SIZES = [10, 20, 50, 100];
export const LEAD_DEFAULT_PAGE_SIZE = 20;
