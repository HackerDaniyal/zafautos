'use server';

import { requireAuth } from '@/lib/auth';
import {
  OrderService,
  DealerService,
  CreateOrderSchema,
  DomainError,
} from '@/server/services';
import { z } from 'zod';

const orderService = new OrderService();
const dealerService = new DealerService();

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

const UUIDSchema = z.string().uuid('Invalid ID');

const OrderStatusSchema = z.enum([
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

export async function createOrder(
  data: z.infer<typeof CreateOrderSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = CreateOrderSchema.parse(data);
    const order = await orderService.createOrder(validated);
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: z.infer<typeof OrderStatusSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(orderId);
    const validatedStatus = OrderStatusSchema.parse(status);
    const order = await orderService.updateOrderStatus(orderId, validatedStatus);
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function cancelOrder(orderId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(orderId);
    const order = await orderService.updateOrderStatus(orderId, 'cancelled');
    return { success: true, data: order };
  } catch (error) {
    return handleError(error);
  }
}

export async function assignDealerToOrder(
  orderId: string,
  dealerId: string,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(orderId);
    UUIDSchema.parse(dealerId);
    const assignment = await dealerService.assignOrder({
      orderId,
      dealerId,
      commissionAmount: 0,
    });
    return { success: true, data: assignment };
  } catch (error) {
    return handleError(error);
  }
}
