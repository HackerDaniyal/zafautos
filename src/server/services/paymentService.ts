import { PaymentsRepository } from '@/server/repositories';
import { z } from 'zod';
import { PaymentNotFoundError, ValidationError } from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  userId: z.string().uuid('Invalid user ID').optional().nullable(),
  amount: z.number().int().nonnegative().default(0),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']).default('pending'),
});
export type CreatePaymentDTO = z.infer<typeof CreatePaymentSchema>;

export const CreateInvoiceSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
});
export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

export const RecordPaymentHistorySchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  note: z.string().optional().nullable(),
});
export type RecordPaymentHistoryDTO = z.infer<typeof RecordPaymentHistorySchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

export class PaymentService {
  constructor(private readonly paymentsRepo: PaymentsRepository = new PaymentsRepository()) {}

  /**
   * Retrieves payments associated with an order.
   */
  async getPaymentsByOrderId(orderId: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    return this.paymentsRepo.findByOrderId(orderId);
  }

  /**
   * Retrieves all payments for a specific user.
   */
  async getPaymentsByUserId(userId: string) {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    return this.paymentsRepo.findByUserId(userId);
  }

  /**
   * Creates a new payment record.
   */
  async createPayment(data: CreatePaymentDTO) {
    const validatedData = CreatePaymentSchema.parse(data);
    return this.paymentsRepo.createPayment(validatedData as unknown as Parameters<typeof this.paymentsRepo.createPayment>[0]);
  }

  /**
   * Generates a new invoice for an order.
   */
  async createInvoice(data: CreateInvoiceDTO) {
    const validatedData = CreateInvoiceSchema.parse(data);
    return this.paymentsRepo.createInvoice(validatedData as unknown as Parameters<typeof this.paymentsRepo.createInvoice>[0]);
  }

  /**
   * Records a change in payment status to history.
   */
  async recordHistory(data: RecordPaymentHistoryDTO) {
    const validatedData = RecordPaymentHistorySchema.parse(data);
    
    // Check if payment exists
    const payment = await this.paymentsRepo.payments.findById(validatedData.paymentId);
    if (!payment) {
      throw new PaymentNotFoundError(validatedData.paymentId);
    }

    return this.paymentsRepo.recordHistory(validatedData as unknown as Parameters<typeof this.paymentsRepo.recordHistory>[0]);
  }

  /**
   * Updates the status of a payment.
   */
  async updatePaymentStatus(paymentId: string, status: CreatePaymentDTO['status']) {
    if (!paymentId) {
      throw new ValidationError('Payment ID is required');
    }

    // Verify payment exists
    const existingPayment = await this.paymentsRepo.payments.findById(paymentId);
    if (!existingPayment) {
      throw new PaymentNotFoundError(paymentId);
    }

    const updated = await this.paymentsRepo.updatePaymentStatus(
      paymentId, 
      status as unknown as Parameters<typeof this.paymentsRepo.updatePaymentStatus>[1]
    );

    if (!updated) {
      throw new PaymentNotFoundError(paymentId);
    }

    // Automatically record history
    await this.paymentsRepo.recordHistory({
      paymentId,
      status,
      note: 'Status updated automatically',
    } as unknown as Parameters<typeof this.paymentsRepo.recordHistory>[0]);

    return updated;
  }
}
