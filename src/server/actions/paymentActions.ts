'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import {
  PaymentService,
  CreatePaymentSchema,
  CreateInvoiceSchema,
} from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { UUIDSchema } from '@/lib/validation/common';
import type { PaymentStatus, InvoiceStatus, TransactionType, PaymentMethodType } from '@/lib/types/payment';
import { z } from 'zod';

const CreateTransactionSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID').optional().nullable(),
  orderId: z.string().uuid('Invalid order ID').optional().nullable(),
  type: z.enum(['deposit', 'balance_payment', 'refund', 'adjustment']),
  amount: z.number().int().nonnegative().default(0),
  method: z.string().min(1, 'Method is required').default('manual'),
  referenceNumber: z.string().optional().nullable(),
  transactionDate: z.date().optional().nullable(),
  receipt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

const UpdateTransactionSchema = z.object({
  type: z.enum(['deposit', 'balance_payment', 'refund', 'adjustment']).optional(),
  amount: z.number().int().nonnegative().optional(),
  method: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
  transactionDate: z.date().optional(),
  receipt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;

const CreatePaymentMethodSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  provider: z.string().min(1, 'Provider is required'),
  type: z.string().optional().nullable(),
  isDefault: z.number().int().nonnegative().max(1).default(0),
  details: z.string().optional().nullable(),
});
type CreatePaymentMethodDTO = z.infer<typeof CreatePaymentMethodSchema>;

const UpdateInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.date().optional(),
  dueDate: z.date().optional(),
  tax: z.number().int().nonnegative().optional(),
  discount: z.number().int().nonnegative().optional(),
  shipping: z.number().int().nonnegative().optional(),
  subtotal: z.number().int().nonnegative().optional(),
  total: z.number().int().nonnegative().optional(),
  balanceDue: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
});
type UpdateInvoiceDTO = z.infer<typeof UpdateInvoiceSchema>;

const paymentService = new PaymentService();

const PaymentStatusSchema = z.enum(['pending', 'paid', 'failed', 'refunded']);
const InvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);
const TransactionTypeSchema = z.enum(['deposit', 'balance_payment', 'refund', 'adjustment']);
const PaymentMethodTypeSchema = z.enum(['bank_transfer', 'credit_card', 'paypal', 'stripe', 'wise', 'payoneer', 'cash', 'manual']);

// ──────────────────────────────────────────────────────────────
// Existing Actions
// ──────────────────────────────────────────────────────────────

export async function createPayment(
  data: z.infer<typeof CreatePaymentSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreatePaymentSchema.parse(data);
    const payment = await paymentService.createPayment(validated);
    return { success: true, data: payment };
  } catch (error) {
    return handleError(error);
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: z.infer<typeof PaymentStatusSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(paymentId);
    const validatedStatus = PaymentStatusSchema.parse(status);
    const payment = await paymentService.updatePaymentStatus(paymentId, validatedStatus);
    return { success: true, data: payment };
  } catch (error) {
    return handleError(error);
  }
}

export async function createInvoice(
  data: z.infer<typeof CreateInvoiceSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreateInvoiceSchema.parse(data);
    const invoice = await paymentService.createInvoice(validated);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}

export async function listPayments(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderId?: string;
  currency?: string;
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const result = await paymentService.listPayments({
      ...params,
      status: params?.status as PaymentStatus | undefined,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPayment(paymentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const payment = await paymentService.getPaymentDetail(paymentId);
    return { success: true, data: payment };
  } catch (error) {
    return handleError(error);
  }
}

export async function changePaymentStatus(
  paymentId: string,
  status: string,
  note?: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    await paymentService.changePaymentStatus(
      paymentId,
      status as PaymentStatus,
      undefined,
      note,
    );
    return { success: true, data: { paymentId, status } };
  } catch (error) {
    return handleError(error);
  }
}

export async function addPaymentNote(
  paymentId: string,
  note: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    await paymentService.addNote(paymentId, note);
    return { success: true, data: { paymentId, note } };
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePaymentNote(noteId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    await paymentService.deleteNote(noteId);
    return { success: true, data: { noteId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function getPaymentStats(): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const stats = await paymentService.getPaymentStats();
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    await paymentService.softDeletePayment(paymentId);
    return { success: true, data: { paymentId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function restorePayment(paymentId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    await paymentService.restorePayment(paymentId);
    return { success: true, data: { paymentId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkUpdatePaymentStatus(
  ids: string[],
  status: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const results = await paymentService.bulkUpdateStatus(ids, status as PaymentStatus);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeletePayments(ids: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const results = await paymentService.bulkDelete(ids);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvoicesByOrder(orderId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const invoices = await paymentService.getInvoicesByOrderId(orderId);
    return { success: true, data: invoices };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const invoice = await paymentService.getInvoiceDetail(invoiceId);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInvoice(
  invoiceId: string,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const invoice = await paymentService.updateInvoice(invoiceId, data);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCustomerFinance(customerId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const finance = await paymentService.getCustomerFinance(customerId);
    return { success: true, data: finance };
  } catch (error) {
    return handleError(error);
  }
}

export async function getOrderFinance(orderId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const finance = await paymentService.getOrderFinance(orderId);
    return { success: true, data: finance };
  } catch (error) {
    return handleError(error);
  }
}

// ──────────────────────────────────────────────────────────────
// Invoice Actions
// ──────────────────────────────────────────────────────────────

export async function listInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const result = await paymentService.listInvoices({
      ...params,
      status: params?.status as InvoiceStatus | undefined,
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvoiceDetail(invoiceId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    UUIDSchema.parse(invoiceId);
    const invoice = await paymentService.getInvoiceDetail(invoiceId);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}

export async function changeInvoiceStatus(
  invoiceId: string,
  status: string,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(invoiceId);
    const validatedStatus = InvoiceStatusSchema.parse(status);
    const invoice = await paymentService.changeInvoiceStatus(invoiceId, validatedStatus);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}

export async function generateInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(invoiceId);
    const invoice = await paymentService.getInvoiceDetail(invoiceId);
    if (invoice.status !== 'draft') {
      throw new Error('Only draft invoices can be generated');
    }
    const generated = await paymentService.changeInvoiceStatus(invoiceId, 'sent');
    return { success: true, data: generated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(invoiceId);
    const invoice = await paymentService.getInvoiceDetail(invoiceId);
    if (invoice.status !== 'draft') {
      throw new Error('Only draft invoices can be deleted');
    }
    await paymentService.softDeleteInvoice(invoiceId);
    return { success: true, data: { invoiceId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(invoiceId);
    await paymentService.restoreInvoice(invoiceId);
    return { success: true, data: { invoiceId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteInvoices(ids: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await paymentService.bulkDeleteInvoices(ids);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function duplicateInvoice(invoiceId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(invoiceId);
    const invoice = await paymentService.duplicateInvoice(invoiceId);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}

// ──────────────────────────────────────────────────────────────
// Transaction Actions
// ──────────────────────────────────────────────────────────────

export async function listTransactions(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  paymentId?: string;
  orderId?: string;
  method?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const paymentId = params?.paymentId;
    const orderId = params?.orderId;

    if (paymentId) {
      const transactions = await paymentService.getTransactionsByPaymentId(paymentId);
      return { success: true, data: transactions };
    } else if (orderId) {
      const transactions = await paymentService.getTransactionsByOrderId(orderId);
      return { success: true, data: transactions };
    } else {
      return { success: false, error: 'Either paymentId or orderId is required' };
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function getTransaction(transactionId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    UUIDSchema.parse(transactionId);
    const transaction = await paymentService.getTransactionById(transactionId);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function recordTransaction(
  data: z.infer<typeof CreateTransactionSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreateTransactionSchema.parse(data);
    const transaction = await paymentService.createTransaction(validated);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function recordDeposit(
  data: z.infer<typeof CreateTransactionSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreateTransactionSchema.parse({ ...data, type: 'deposit' });
    const transaction = await paymentService.recordDeposit(validated);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function recordBalancePayment(
  data: z.infer<typeof CreateTransactionSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreateTransactionSchema.parse({ ...data, type: 'balance_payment' });
    const transaction = await paymentService.recordBalancePayment(validated);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function recordRefund(
  data: z.infer<typeof CreateTransactionSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreateTransactionSchema.parse({ ...data, type: 'refund' });
    const transaction = await paymentService.recordRefund(validated);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function recordAdjustment(
  data: z.infer<typeof CreateTransactionSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreateTransactionSchema.parse({ ...data, type: 'adjustment' });
    const transaction = await paymentService.recordAdjustment(validated);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTransaction(
  transactionId: string,
  data: Record<string, unknown>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(transactionId);
    const validated = UpdateTransactionSchema.parse(data);
    const transaction = await paymentService.updateTransaction(transactionId, validated);
    return { success: true, data: transaction };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(transactionId);
    await paymentService.softDeleteTransaction(transactionId);
    return { success: true, data: { transactionId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreTransaction(transactionId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    UUIDSchema.parse(transactionId);
    await paymentService.restoreTransaction(transactionId);
    return { success: true, data: { transactionId } };
  } catch (error) {
    return handleError(error);
  }
}

// ──────────────────────────────────────────────────────────────
// Payment Method Actions
// ──────────────────────────────────────────────────────────────

export async function listPaymentMethods(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const methods = await paymentService.getPaymentMethods(userId);
    return { success: true, data: methods };
  } catch (error) {
    return handleError(error);
  }
}

export async function getDefaultPaymentMethod(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.read');
    const method = await paymentService.getDefaultPaymentMethod(userId);
    return { success: true, data: method };
  } catch (error) {
    return handleError(error);
  }
}

export async function createPaymentMethod(
  data: z.infer<typeof CreatePaymentMethodSchema>,
): Promise<ActionResult> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'payments.create');
    const validated = CreatePaymentMethodSchema.parse(data);
    const method = await paymentService.createPaymentMethod(validated);
    return { success: true, data: method };
  } catch (error) {
    return handleError(error);
  }
}

// Note: No delete/restore actions for payment methods in this version
