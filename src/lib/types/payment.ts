import type { payments, paymentHistory, paymentMethods, currencies, exchangeRates, invoices, paymentTransactions } from '@/server/db/schema';
import type { OrderDocument as OrderDocumentType } from '@/lib/types/order';

// Re-export OrderDocument from its canonical location
export type { OrderDocument } from '@/lib/types/order';

// ─── Schema-derived types ──────────────────────────────────────────────────

export type Payment = typeof payments.$inferSelect;
export type PaymentInsert = typeof payments.$inferInsert;
export type PaymentHistoryRecord = typeof paymentHistory.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type Currency = typeof currencies.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

// ─── Union types ───────────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type TransactionType = 'deposit' | 'balance_payment' | 'refund' | 'adjustment';
export type PaymentMethodType = 'bank_transfer' | 'credit_card' | 'stripe' | 'paypal' | 'wise' | 'payoneer' | 'cash' | 'manual';

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface PaymentWithRelations extends Payment {
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  dealerName?: string;
  vehicleTitle?: string;
  vehicleVin?: string;
}

export interface PaymentDetail extends Payment {
  history: PaymentHistoryRecord[];
  transactions: PaymentTransaction[];
  documents: OrderDocumentType[];
  order?: {
    id: string;
    orderNumber: string;
    customerId: string | null;
    dealerId: string | null;
    vehicleId: string | null;
    status: string;
    totalAmount: number;
  };
  customer?: { id: string; displayName?: string; email?: string } | null;
  dealer?: { id: string; displayName?: string } | null;
  vehicle?: { id: string; year?: number; vin?: string; stockNumber?: string; manufacturerId?: string; modelId?: string } | null;
  invoices: Invoice[];
}

export interface InvoiceDetail extends Invoice {
  order?: {
    id: string;
    orderNumber: string;
    totalAmount: number;
    customerId: string | null;
    dealerId: string | null;
  };
  customer?: { id: string; displayName?: string; email?: string } | null;
  payments: Payment[];
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: PaymentStatus;
  orderId?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaymentStats {
  totalRevenue: number;
  outstandingBalance: number;
  paidOrders: number;
  unpaidOrders: number;
  partialPayments: number;
  refunds: number;
  monthlyRevenue: number;
  upcomingDuePayments: number;
}

// ─── Status transitions ────────────────────────────────────────────────────

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: ['pending'],
  refunded: [],
};

export function isValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'],
  sent: ['paid', 'overdue', 'cancelled'],
  paid: ['cancelled'],
  overdue: ['paid', 'cancelled'],
  cancelled: [],
};

export function isValidInvoiceTransition(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return INVOICE_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
