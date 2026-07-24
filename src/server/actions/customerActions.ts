'use server';

import { requireAuth } from '@/lib/auth';
import {
  CustomerService,
  CreateAddressSchema,
  DomainError,
} from '@/server/services';
import type { CustomerStatus, CustomerListParams } from '@/lib/types/customer';
import { z } from 'zod';

const customerService = new CustomerService();

const UUIDSchema = z.string().uuid('Invalid ID');

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

export async function listCustomers(params?: CustomerListParams): Promise<ActionResult> {
  try {
    await requireAuth();
    const result = await customerService.listCustomers(params);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCustomer(customerId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(customerId);
    const customer = await customerService.getCustomerDetail(customerId);
    return { success: true, data: customer };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCustomerStats(): Promise<ActionResult> {
  try {
    await requireAuth();
    const stats = await customerService.getCustomerStats();
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}

export async function changeCustomerStatus(
  customerId: string,
  status: string,
  note?: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(customerId);
    const result = await customerService.changeCustomerStatus(
      customerId,
      status as CustomerStatus,
      session.userId,
      note,
    );
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(customerId);
    await customerService.softDeleteCustomer(customerId, session.userId);
    return { success: true, data: { customerId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreCustomer(customerId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(customerId);
    await customerService.restoreCustomer(customerId);
    return { success: true, data: { customerId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkUpdateCustomerStatus(
  ids: string[],
  status: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await customerService.bulkUpdateStatus(ids, status as CustomerStatus, session.userId);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteCustomers(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await customerService.bulkDelete(ids, session.userId);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function exportCustomersCsv(
  params: CustomerListParams,
): Promise<ActionResult<string>> {
  try {
    await requireAuth();
    const result = await customerService.listCustomers({ ...params, limit: 10000, page: 1 });
    const rows = result.data.map((row: Record<string, unknown>) => ({
      email: (row as { email?: string }).email ?? '',
      firstName: (row as { firstName?: string }).firstName ?? '',
      lastName: (row as { lastName?: string }).lastName ?? '',
      displayName: (row as { displayName?: string }).displayName ?? '',
      phone: (row as { phone?: string }).phone ?? '',
      status: (row as { status?: string }).status ?? '',
      orderCount: (row as { orderCount?: number }).orderCount ?? 0,
      totalSpent: (row as { totalSpent?: number }).totalSpent ?? 0,
      createdAt: (row as { createdAt?: string }).createdAt ?? '',
    }));
    const headers = ['Email', 'First Name', 'Last Name', 'Display Name', 'Phone', 'Status', 'Orders', 'Total Spent', 'Created'];
    const csvRows = [
      headers.join(','),
      ...rows.map((r) =>
        [
          `"${r.email}"`,
          `"${r.firstName}"`,
          `"${r.lastName}"`,
          `"${r.displayName}"`,
          `"${r.phone}"`,
          `"${r.status}"`,
          r.orderCount,
          r.totalSpent,
          `"${r.createdAt}"`,
        ].join(',')
      ),
    ];
    return { success: true, data: csvRows.join('\n') };
  } catch (error) {
    return handleError(error);
  }
}
