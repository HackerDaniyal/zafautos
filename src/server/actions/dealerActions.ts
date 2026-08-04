'use server';

import { requireAuth } from '@/lib/auth';
import { DealerService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { UUIDSchema, ProfileUpdateSchema } from '@/lib/validation/common';
import type { DealerStatus, DealerListParams } from '@/lib/types/dealer';
import { z } from 'zod';

const dealerService = new DealerService();

type ProfileUpdateDTO = z.infer<typeof ProfileUpdateSchema>;

export async function getDealerForEditAction(dealerId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(dealerId);
    const dealer = await dealerService.getDealerForEdit(dealerId);
    return { success: true, data: dealer };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateDealerProfile(
  dealerId: string,
  data: ProfileUpdateDTO,
): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(dealerId);
    const validated = ProfileUpdateSchema.parse(data);
    const profile = await dealerService.upsertProfile(dealerId, {
      displayName: validated.displayName,
    });
    return { success: true, data: profile };
  } catch (error) {
    return handleError(error);
  }
}

export async function listDealers(params?: DealerListParams): Promise<ActionResult> {
  try {
    await requireAuth();
    const result = await dealerService.listDealers(params);
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function getDealer(dealerId: string): Promise<ActionResult> {
  try {
    await requireAuth();
    UUIDSchema.parse(dealerId);
    const dealer = await dealerService.getDealerDetail(dealerId);
    return { success: true, data: dealer };
  } catch (error) {
    return handleError(error);
  }
}

export async function getDealerStats(): Promise<ActionResult> {
  try {
    await requireAuth();
    const stats = await dealerService.getDealerStats();
    return { success: true, data: stats };
  } catch (error) {
    return handleError(error);
  }
}

export async function changeDealerStatus(
  dealerId: string,
  status: string,
  note?: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(dealerId);
    const result = await dealerService.changeDealerStatus(
      dealerId,
      status as DealerStatus,
      session.userId,
      note,
    );
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteDealer(dealerId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(dealerId);
    await dealerService.softDeleteDealer(dealerId, session.userId);
    return { success: true, data: { dealerId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreDealer(dealerId: string): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    UUIDSchema.parse(dealerId);
    await dealerService.restoreDealer(dealerId);
    return { success: true, data: { dealerId } };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkUpdateDealerStatus(
  ids: string[],
  status: string,
): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await dealerService.bulkUpdateStatus(ids, status as DealerStatus, session.userId);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function bulkDeleteDealers(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireAuth();
    ids.forEach((id) => UUIDSchema.parse(id));
    const results = await dealerService.bulkDelete(ids, session.userId);
    return { success: true, data: results };
  } catch (error) {
    return handleError(error);
  }
}

export async function exportDealersCsv(
  params: DealerListParams,
): Promise<ActionResult<string>> {
  try {
    await requireAuth();
    const result = await dealerService.listDealers({ ...params, limit: 10000, page: 1 });
    const rows = result.data.map((row: Record<string, unknown>) => ({
      email: (row as { email?: string }).email ?? '',
      firstName: (row as { firstName?: string }).firstName ?? '',
      lastName: (row as { lastName?: string }).lastName ?? '',
      displayName: (row as { displayName?: string }).displayName ?? '',
      phone: (row as { phone?: string }).phone ?? '',
      status: (row as { status?: string }).status ?? '',
      orderCount: (row as { orderCount?: number }).orderCount ?? 0,
      totalRevenue: (row as { totalRevenue?: number }).totalRevenue ?? 0,
      createdAt: (row as { createdAt?: string }).createdAt ?? '',
    }));
    const headers = ['Email', 'First Name', 'Last Name', 'Display Name', 'Phone', 'Status', 'Orders', 'Revenue', 'Created'];
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
          r.totalRevenue,
          `"${r.createdAt}"`,
        ].join(',')
      ),
    ];
    return { success: true, data: csvRows.join('\n') };
  } catch (error) {
    return handleError(error);
  }
}
