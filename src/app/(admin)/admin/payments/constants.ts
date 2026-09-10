import type { PaymentStatus, InvoiceStatus } from '@/lib/types/payment';

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  pending: { label: 'Pending', color: 'text-auction-amber', bgColor: 'bg-auction-amber/10', dotColor: 'bg-auction-amber' },
  paid: { label: 'Paid', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  failed: { label: 'Failed', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
  refunded: { label: 'Refunded', color: 'text-ash', bgColor: 'bg-ash/10', dotColor: 'bg-ash' },
};

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  draft: { label: 'Draft', color: 'text-steel', bgColor: 'bg-steel/10', dotColor: 'bg-steel' },
  sent: { label: 'Sent', color: 'text-blue-400', bgColor: 'bg-blue-400/10', dotColor: 'bg-blue-400' },
  paid: { label: 'Paid', color: 'text-available-green', bgColor: 'bg-available-green/10', dotColor: 'bg-available-green' },
  overdue: { label: 'Overdue', color: 'text-signal-red', bgColor: 'bg-signal-red/10', dotColor: 'bg-signal-red' },
  cancelled: { label: 'Cancelled', color: 'text-ash', bgColor: 'bg-ash/10', dotColor: 'bg-ash' },
};

export const INVOICE_STATUS_OPTIONS = Object.entries(INVOICE_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'wise', label: 'Wise' },
  { value: 'payoneer', label: 'Payoneer' },
  { value: 'cash', label: 'Cash' },
  { value: 'manual', label: 'Manual' },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'deposit', label: 'Deposit' },
  { value: 'balance_payment', label: 'Balance Payment' },
  { value: 'refund', label: 'Refund' },
  { value: 'adjustment', label: 'Manual Adjustment' },
];

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'EUR', label: 'EUR - Euro' },
];

export const PAYMENT_PAGE_SIZES = [10, 20, 50, 100];
export const PAYMENT_DEFAULT_PAGE_SIZE = 20;

export const PAYMENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'customer', label: 'Customer' },
  { id: 'order', label: 'Order' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'documents', label: 'Documents' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
] as const;

export type PaymentTab = typeof PAYMENT_TABS[number]['id'];
