'use server';

import { requireAuth } from '@/lib/auth';
import {
  CustomerService,
  CreateAddressSchema,
  DomainError,
} from '@/server/services';
import { z } from 'zod';

const customerService = new CustomerService();

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

const ProfileUpdateSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
});
type ProfileUpdateDTO = z.infer<typeof ProfileUpdateSchema>;

export async function updateCustomerProfile(
  customerId: string,
  data: ProfileUpdateDTO,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(customerId);
    const validated = ProfileUpdateSchema.parse(data);
    const profile = await customerService.upsertProfile(customerId, {
      displayName: validated.displayName,
    });
    return { success: true, data: profile };
  } catch (error) {
    return handleError(error);
  }
}

export async function addAddress(
  data: z.infer<typeof CreateAddressSchema>,
): Promise<ActionResult> {
  try {
    await requireAuth();
    const validated = CreateAddressSchema.parse(data);
    const address = await customerService.createAddress(validated);
    return { success: true, data: address };
  } catch (error) {
    return handleError(error);
  }
}

export async function removeAddress(addressId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(addressId);
    await customerService.removeAddress(addressId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function addToWishlist(
  customerId: string,
  vehicleId: string,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(customerId);
    UUIDSchema.parse(vehicleId);
    const entry = await customerService.addToWishlist(customerId, vehicleId);
    return { success: true, data: entry };
  } catch (error) {
    return handleError(error);
  }
}

export async function removeFromWishlist(
  customerId: string,
  vehicleId: string,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(customerId);
    UUIDSchema.parse(vehicleId);
    await customerService.removeFromWishlist(customerId, vehicleId);
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
