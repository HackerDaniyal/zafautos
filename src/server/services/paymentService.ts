import { PaymentsRepository } from '@/server/repositories';
import { z } from 'zod';
import { PaymentNotFoundError, ValidationError, InvoiceNotFoundError, TransactionNotFoundError } from './errors';
import { auditService } from './auditService';
import { isValidPaymentTransition, isValidInvoiceTransition, type PaymentStatus, type InvoiceStatus } from '@/lib/types/payment';

// ──────────────────────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
  amount: z.number().int().nonnegative().default(0),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
  paymentMethod: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});
export type CreatePaymentDTO = z.infer<typeof CreatePaymentSchema>;

export const CreateInvoiceSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  invoiceNumber: z.string().min(1, 'Invoice number is required').optional().nullable(),
  invoiceDate: z.date().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  tax: z.number().int().nonnegative().default(0),
  discount: z.number().int().nonnegative().default(0),
  shipping: z.number().int().nonnegative().default(0),
  subtotal: z.number().int().nonnegative().default(0),
  total: z.number().int().nonnegative().default(0),
  balanceDue: z.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  notes: z.string().optional().nullable(),
});
export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

export const UpdateInvoiceSchema = z.object({
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
export type UpdateInvoiceDTO = z.infer<typeof UpdateInvoiceSchema>;

export const RecordPaymentHistorySchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  note: z.string().optional().nullable(),
});
export type RecordPaymentHistoryDTO = z.infer<typeof RecordPaymentHistorySchema>;

export const CreateTransactionSchema = z.object({
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
export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

export const UpdateTransactionSchema = z.object({
  type: z.enum(['deposit', 'balance_payment', 'refund', 'adjustment']).optional(),
  amount: z.number().int().nonnegative().optional(),
  method: z.string().optional(),
  referenceNumber: z.string().optional().nullable(),
  transactionDate: z.date().optional(),
  receipt: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;

export const CreatePaymentMethodSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  provider: z.string().min(1, 'Provider is required'),
  type: z.string().optional().nullable(),
  isDefault: z.number().int().nonnegative().max(1).default(0),
  details: z.string().optional().nullable(),
});
export type CreatePaymentMethodDTO = z.infer<typeof CreatePaymentMethodSchema>;

// ──────────────────────────────────────────────────────────────
// Service Layer
// ──────────────────────────────────────────────────────────────

export class PaymentService {
  constructor(private readonly paymentsRepo: PaymentsRepository = new PaymentsRepository()) {}

  async getPaymentsByOrderId(orderId: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    return this.paymentsRepo.findByOrderId(orderId);
  }

  async getPaymentsByUserId(userId: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    return this.paymentsRepo.findByUserId(userId);
  }

  async createPayment(data: CreatePaymentDTO) {
    const validatedData = CreatePaymentSchema.parse(data);
    const result = await this.paymentsRepo.createPayment(validatedData as unknown as Parameters<typeof this.paymentsRepo.createPayment>[0]);
    await auditService.logAction({
      action: 'payment.created',
      entityType: 'payment',
      entityId: result.id as string,
      entityLabel: `Payment for order ${validatedData.orderId}`,
      changes: { amount: { old: null, new: validatedData.amount }, currency: { old: null, new: validatedData.currency } },
    });
    return result;
  }

  async createInvoice(data: CreateInvoiceDTO) {
    const validatedData = CreateInvoiceSchema.parse(data);
    const subtotal = validatedData.subtotal ?? 0;
    const tax = validatedData.tax ?? 0;
    const discount = validatedData.discount ?? 0;
    const shipping = validatedData.shipping ?? 0;
    const total = validatedData.total ?? (subtotal + tax - discount + shipping);
    const balanceDue = validatedData.balanceDue ?? total;
    const result = await this.paymentsRepo.createInvoiceWithNumber({
      ...validatedData,
      subtotal,
      total,
      balanceDue,
    } as unknown as Parameters<typeof this.paymentsRepo.createInvoiceWithNumber>[0]);
    await auditService.logAction({
      action: 'invoice.created',
      entityType: 'invoice',
      entityId: result.id as string,
      entityLabel: result.invoiceNumber as string,
      changes: { orderId: { old: null, new: validatedData.orderId }, total: { old: null, new: total }, balanceDue: { old: null, new: balanceDue } },
    });
    return result;
  }

  async recordHistory(data: RecordPaymentHistoryDTO) {
    const validatedData = RecordPaymentHistorySchema.parse(data);
    const payment = await this.paymentsRepo.payments.findById(validatedData.paymentId);
    if (!payment) {
      throw new PaymentNotFoundError(validatedData.paymentId);
    }
    return this.paymentsRepo.recordHistory(validatedData as unknown as Parameters<typeof this.paymentsRepo.recordHistory>[0]);
  }

  async updatePaymentStatus(paymentId: string, status: CreatePaymentDTO['status']) {
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }
    const existingPayment = await this.paymentsRepo.payments.findById(paymentId);
    if (!existingPayment) {
      throw new PaymentNotFoundError(paymentId);
    }

    const currentStatus = (existingPayment as { status: string }).status as PaymentStatus;
    if (!isValidPaymentTransition(currentStatus, status as PaymentStatus)) {
      throw new ValidationError(`Invalid status transition from ${currentStatus} to ${status}`);
    }

    const updated = await this.paymentsRepo.updatePaymentStatus(
      paymentId,
      status as unknown as Parameters<typeof this.paymentsRepo.updatePaymentStatus>[1]
    );
    if (!updated) {
      throw new PaymentNotFoundError(paymentId);
    }
    await this.paymentsRepo.recordHistory({
      paymentId,
      status,
      note: 'Status updated automatically',
    } as unknown as Parameters<typeof this.paymentsRepo.recordHistory>[0]);
    return updated;
  }

  async listPayments(params: {
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
  } = {}) {
    return this.paymentsRepo.listPayments({
      pagination: { page: params.page, limit: params.limit },
      sort: { column: params.sortColumn, direction: params.sortDirection },
      status: params.status,
      orderId: params.orderId,
      currency: params.currency,
      search: params.search,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
  }

  async getPaymentDetail(paymentId: string) {
    const payment = await this.paymentsRepo.getPaymentWithTransactions(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }
    return payment;
  }

  async changePaymentStatus(paymentId: string, newStatus: string, userId?: string, note?: string) {
    const payment = await this.paymentsRepo.payments.findById(paymentId) as unknown as { id: string; status: string } | null;
    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }
    const currentStatus = payment.status as PaymentStatus;
    if (!isValidPaymentTransition(currentStatus, newStatus as PaymentStatus)) {
      throw new ValidationError(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
    await this.paymentsRepo.updatePaymentStatusWithHistory(paymentId, newStatus as CreatePaymentDTO['status'], userId);
    await auditService.logAction({
      action: 'payment.status_changed',
      entityType: 'payment',
      entityId: paymentId,
      changes: { from: { old: currentStatus, new: newStatus }, note: { old: null, new: note ?? null } },
    });
    return { success: true };
  }

  async addNote(paymentId: string, note: string, userId?: string) {
    const payment = await this.paymentsRepo.payments.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }
    const result = await this.paymentsRepo.addPaymentHistory(paymentId, (payment as unknown as { status: string }).status as CreatePaymentDTO['status'], note, userId);
    await auditService.logAction({
      action: 'payment.note_added',
      entityType: 'payment',
      entityId: paymentId,
      changes: { note: { old: null, new: note } },
    });
    return result;
  }

  async deleteNote(noteId: string) {
    const result = await this.paymentsRepo.history.delete(noteId);
    return result;
  }

  async getPaymentHistory(paymentId: string) {
    return this.paymentsRepo.getPaymentHistory(paymentId);
  }

  async getInvoiceDetail(invoiceId: string) {
    const invoice = await this.paymentsRepo.getInvoiceWithRelations(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    return invoice;
  }

  async updateInvoice(invoiceId: string, data: UpdateInvoiceDTO) {
    const validated = UpdateInvoiceSchema.parse(data);
    const existing = await this.paymentsRepo.invoices.findById(invoiceId);
    if (!existing) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    const oldStatus = (existing as unknown as { status: string }).status as InvoiceStatus;
    const newStatus = validated.status;
    if (newStatus && oldStatus && newStatus !== oldStatus) {
      if (!isValidInvoiceTransition(oldStatus, newStatus as InvoiceStatus)) {
        throw new ValidationError(`Cannot transition invoice from ${oldStatus} to ${newStatus}`);
      }
    }
    const updated = await this.paymentsRepo.updateInvoice(invoiceId, validated as unknown as Parameters<typeof this.paymentsRepo.updateInvoice>[1]);
    await auditService.logAction({
      action: 'invoice.updated',
      entityType: 'invoice',
      entityId: invoiceId,
      changes: Object.fromEntries(Object.entries(validated).map(([k, v]) => [k, { old: null, new: v }])),
    });
    return updated;
  }

  async getInvoicesByOrderId(orderId: string) {
    return this.paymentsRepo.getInvoicesByOrderId(orderId);
  }

  async softDeletePayment(paymentId: string, userId?: string) {
    const payment = await this.paymentsRepo.payments.findById(paymentId) as unknown as { deletedAt: Date | null } | null;
    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }
    if (payment.deletedAt) {
      throw new ValidationError('Payment is already deleted');
    }
    const result = await this.paymentsRepo.softDeletePayment(paymentId, userId);
    await auditService.logAction({
      action: 'payment.deleted',
      entityType: 'payment',
      entityId: paymentId,
    });
    return result;
  }

  async restorePayment(paymentId: string) {
    const payment = await this.paymentsRepo.payments.findById(paymentId) as unknown as { deletedAt: Date | null } | null;
    if (!payment) {
      throw new PaymentNotFoundError(paymentId);
    }
    if (!payment.deletedAt) {
      throw new ValidationError('Payment is not deleted');
    }
    const result = await this.paymentsRepo.restorePayment(paymentId);
    await auditService.logAction({
      action: 'payment.restored',
      entityType: 'payment',
      entityId: paymentId,
    });
    return result;
  }

  async bulkUpdateStatus(ids: string[], status: string, userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.changePaymentStatus(id, status, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }

  async bulkDelete(ids: string[], userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.softDeletePayment(id, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }

  async getPaymentStats() {
    return this.paymentsRepo.getPaymentStats();
  }

  async getCustomerFinance(customerId: string) {
    return this.paymentsRepo.getCustomerFinance(customerId);
  }

  async getOrderFinance(orderId: string) {
    return this.paymentsRepo.getOrderFinance(orderId);
  }

  // ──────────────────────────────────────────────────────────────
  // Invoice methods
  // ──────────────────────────────────────────────────────────────

  async listInvoices(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    orderId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    return this.paymentsRepo.listInvoices({
      pagination: { page: params.page, limit: params.limit },
      sort: { column: params.sortColumn, direction: params.sortDirection },
      status: params.status,
      orderId: params.orderId,
      search: params.search,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
  }

  async getInvoiceById(invoiceId: string) {
    const invoice = await this.paymentsRepo.getInvoiceById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    return invoice;
  }

  async changeInvoiceStatus(invoiceId: string, newStatus: string) {
    const invoice = await this.paymentsRepo.invoices.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    const currentStatus = (invoice as unknown as { status: string }).status as InvoiceStatus;
    if (!isValidInvoiceTransition(currentStatus, newStatus as InvoiceStatus)) {
      throw new ValidationError(`Cannot transition invoice from ${currentStatus} to ${newStatus}`);
    }
    const updated = await this.paymentsRepo.updateInvoice(invoiceId, { status: newStatus } as unknown as Parameters<typeof this.paymentsRepo.updateInvoice>[1]);
    await auditService.logAction({
      action: 'invoice.status_changed',
      entityType: 'invoice',
      entityId: invoiceId,
      changes: { status: { old: currentStatus, new: newStatus } },
    });
    return updated;
  }

  async softDeleteInvoice(invoiceId: string, userId?: string) {
    const invoice = await this.paymentsRepo.invoices.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    const result = await this.paymentsRepo.softDeleteInvoice(invoiceId, userId);
    await auditService.logAction({
      action: 'invoice.deleted',
      entityType: 'invoice',
      entityId: invoiceId,
    });
    return result;
  }

  async restoreInvoice(invoiceId: string) {
    const invoice = await this.paymentsRepo.invoices.findById(invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    const result = await this.paymentsRepo.restoreInvoice(invoiceId);
    await auditService.logAction({
      action: 'invoice.restored',
      entityType: 'invoice',
      entityId: invoiceId,
    });
    return result;
  }

  async bulkDeleteInvoices(ids: string[], userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.softDeleteInvoice(id, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return results;
  }

  async duplicateInvoice(invoiceId: string, userId?: string) {
    const original = await this.paymentsRepo.invoices.findById(invoiceId);
    if (!original) {
      throw new InvoiceNotFoundError(invoiceId);
    }
    const typedOriginal = original as unknown as typeof import('@/server/db/schema').invoices.$inferSelect;
    const newInvoiceNumber = await this.paymentsRepo.generateInvoiceNumber();
    const result = await this.paymentsRepo.createInvoiceWithNumber({
      ...typedOriginal,
      id: undefined,
      invoiceNumber: newInvoiceNumber,
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
      deletedAt: null,
      deletedBy: null,
    } as unknown as Parameters<typeof this.paymentsRepo.createInvoiceWithNumber>[0]);
    await auditService.logAction({
      action: 'invoice.duplicated',
      entityType: 'invoice',
      entityId: result.id as string,
      entityLabel: newInvoiceNumber,
      changes: { originalInvoiceId: { old: null, new: invoiceId }, newInvoiceId: { old: null, new: result.id } },
    });
    return result;
  }

  // ──────────────────────────────────────────────────────────────
  // Transaction methods
  // ──────────────────────────────────────────────────────────────

  async createTransaction(data: CreateTransactionDTO) {
    const validated = CreateTransactionSchema.parse(data);
    if (!validated.paymentId && !validated.orderId) {
      throw new ValidationError('Either paymentId or orderId is required');
    }
    const result = await this.paymentsRepo.createTransaction(validated as unknown as Parameters<typeof this.paymentsRepo.createTransaction>[0]);
    await auditService.logAction({
      action: 'transaction.created',
      entityType: 'payment_transaction',
      entityId: result.id as string,
      changes: { type: { old: null, new: validated.type }, amount: { old: null, new: validated.amount }, method: { old: null, new: validated.method } },
    });
    return result;
  }

  async getTransactionsByPaymentId(paymentId: string) {
    return this.paymentsRepo.getTransactionsByPaymentId(paymentId);
  }

  async getTransactionsByOrderId(orderId: string) {
    return this.paymentsRepo.getTransactionsByOrderId(orderId);
  }

  async getTransactionById(transactionId: string) {
    const transaction = await this.paymentsRepo.getTransactionById(transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }
    return transaction;
  }

  async updateTransaction(transactionId: string, data: UpdateTransactionDTO) {
    const validated = UpdateTransactionSchema.parse(data);
    const existing = await this.paymentsRepo.getTransactionById(transactionId);
    if (!existing) {
      throw new TransactionNotFoundError(transactionId);
    }
    const result = await this.paymentsRepo.updateTransaction(transactionId, validated as unknown as Parameters<typeof this.paymentsRepo.updateTransaction>[1]);
    await auditService.logAction({
      action: 'transaction.updated',
      entityType: 'payment_transaction',
      entityId: transactionId,
      changes: Object.fromEntries(Object.entries(validated).map(([k, v]) => [k, { old: null, new: v }])),
    });
    return result;
  }

  async softDeleteTransaction(transactionId: string, userId?: string) {
    const transaction = await this.paymentsRepo.getTransactionById(transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }
    const result = await this.paymentsRepo.softDeleteTransaction(transactionId, userId);
    await auditService.logAction({
      action: 'transaction.deleted',
      entityType: 'payment_transaction',
      entityId: transactionId,
    });
    return result;
  }

  async restoreTransaction(transactionId: string) {
    const transaction = await this.paymentsRepo.getTransactionById(transactionId);
    if (!transaction) {
      throw new TransactionNotFoundError(transactionId);
    }
    const result = await this.paymentsRepo.restoreTransaction(transactionId);
    await auditService.logAction({
      action: 'transaction.restored',
      entityType: 'payment_transaction',
      entityId: transactionId,
    });
    return result;
  }

  async recordDeposit(data: CreateTransactionDTO) {
    return this.createTransaction({ ...data, type: 'deposit' });
  }

  async recordBalancePayment(data: CreateTransactionDTO) {
    return this.createTransaction({ ...data, type: 'balance_payment' });
  }

  async recordRefund(data: CreateTransactionDTO) {
    const validated = CreateTransactionSchema.parse({ ...data, type: 'refund' });
    if (validated.paymentId) {
      const payment = await this.paymentsRepo.payments.findById(validated.paymentId);
      if (!payment) {
        throw new PaymentNotFoundError(validated.paymentId);
      }
    }
    return this.createTransaction({ ...data, type: 'refund' });
  }

  async recordAdjustment(data: CreateTransactionDTO) {
    return this.createTransaction({ ...data, type: 'adjustment' });
  }

  // ──────────────────────────────────────────────────────────────
  // Payment method methods
  // ──────────────────────────────────────────────────────────────

  async getPaymentMethods(userId: string) {
    return this.paymentsRepo.getPaymentMethodsByUserId(userId);
  }

  async createPaymentMethod(data: CreatePaymentMethodDTO) {
    const validated = CreatePaymentMethodSchema.parse(data);
    const result = await this.paymentsRepo.createPaymentMethod(validated as unknown as Parameters<typeof this.paymentsRepo.createPaymentMethod>[0]);
    await auditService.logAction({
      action: 'payment_method.created',
      entityType: 'payment_method',
      entityId: result.id as string,
      changes: { provider: { old: null, new: validated.provider }, type: { old: null, new: validated.type } },
    });
    return result;
  }

  async getDefaultPaymentMethod(userId: string) {
    return this.paymentsRepo.getDefaultPaymentMethod(userId);
  }
}

// ──────────────────────────────────────────────────────────────
// Status Transition Helpers
// ──────────────────────────────────────────────────────────────
// Note: Payment and invoice transition validation uses canonical
// validators from @/lib/types/payment
// ──────────────────────────────────────────────────────────────