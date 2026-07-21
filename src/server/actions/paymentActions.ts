'use server';

import { requireAuth } from '@/lib/auth';
import {
  PaymentService,
  CreatePaymentSchema,
  CreateInvoiceSchema,
  DomainError,
} from '@/server/services';
import { z } from 'zod';

const paymentService = new PaymentService();

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

function handleError(error: unknown): { success: false; error: string; code?: string } {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map((e) => e.message).join(', '),
      code: 'VALIDATION_ERROR',
    };
  }
  if (error instanceof DomainError) {
    return { success: false, error: error.message, code: error.code };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  };
}

const PaymentStatusSchema = z.enum(['pending', 'paid', 'failed', 'refunded']);

const UUIDSchema = z.string().uuid('Invalid ID');

export async function createPayment(
  data: z.infer<typeof CreatePaymentSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
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
    await requireAuth();
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
    await requireAuth();
    const validated = CreateInvoiceSchema.parse(data);
    const invoice = await paymentService.createInvoice(validated);
    return { success: true, data: invoice };
  } catch (error) {
    return handleError(error);
  }
}
