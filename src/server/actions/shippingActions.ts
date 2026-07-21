'use server';

import { requireAuth } from '@/lib/auth';
import {
  ShippingService,
  CreateShipmentSchema,
  AddTrackingEventSchema,
  AddContainerSchema,
  DomainError,
} from '@/server/services';
import { z } from 'zod';

const shippingService = new ShippingService();

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

export async function createShipment(
  data: z.infer<typeof CreateShipmentSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = CreateShipmentSchema.parse(data);
    const shipment = await shippingService.createShipment(validated);
    return { success: true, data: shipment };
  } catch (error) {
    return handleError(error);
  }
}

export async function addTrackingEvent(
  data: z.infer<typeof AddTrackingEventSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = AddTrackingEventSchema.parse(data);
    const event = await shippingService.addTrackingEvent(validated);
    return { success: true, data: event };
  } catch (error) {
    return handleError(error);
  }
}

export async function addContainer(
  data: z.infer<typeof AddContainerSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = AddContainerSchema.parse(data);
    const container = await shippingService.addContainer(validated);
    return { success: true, data: container };
  } catch (error) {
    return handleError(error);
  }
}
