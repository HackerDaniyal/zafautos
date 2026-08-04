'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listCurrencies(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listCurrencies();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function listActiveCurrencies(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listActiveCurrencies();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCurrency(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getCurrency(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createCurrency(data: {
  name: string;
  code: string;
  symbol?: string;
  decimalPlaces?: number;
  symbolPosition?: 'before' | 'after';
  isDefault?: boolean;
  exchangeRate?: number;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const created = await settingsService.createCurrency({
      name: data.name,
      code: data.code,
      symbol: data.symbol,
      decimalPlaces: data.decimalPlaces ?? 2,
      symbolPosition: data.symbolPosition ?? 'before',
      isDefault: data.isDefault ?? false,
      exchangeRate: data.exchangeRate ?? 1,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    });
    await auditService.logAction({
      action: 'currency.created',
      entityType: 'currency',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
      changes: { name: { old: null, new: data.name }, code: { old: null, new: data.code } },
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCurrency(id: string, data: {
  name?: string;
  code?: string;
  symbol?: string;
  decimalPlaces?: number;
  symbolPosition?: 'before' | 'after';
  isDefault?: boolean;
  exchangeRate?: number;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const updated = await settingsService.updateCurrency(id, data);
    await auditService.logAction({
      action: 'currency.updated',
      entityType: 'currency',
      entityId: id,
      entityLabel: data.name ?? 'Currency',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCurrency(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.deleteCurrency(id);
    await auditService.logAction({
      action: 'currency.deleted',
      entityType: 'currency',
      entityId: id,
      entityLabel: 'Currency',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreCurrency(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.restoreCurrency(id);
    await auditService.logAction({
      action: 'currency.restored',
      entityType: 'currency',
      entityId: id,
      entityLabel: 'Currency',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
