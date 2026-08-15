'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listTaxRates(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listTaxRates();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function listActiveTaxRates(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listActiveTaxRates();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getTaxRate(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getTaxRate(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createTaxRate(data: {
  name: string;
  countryId?: string;
  rate: number;
  type?: 'percentage' | 'fixed';
  isDefault?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const created = await settingsService.createTaxRate({
      name: data.name,
      countryId: data.countryId,
      rate: data.rate,
      type: data.type ?? 'percentage',
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    });
    await auditService.logAction({
      action: 'tax_rate.created',
      entityType: 'tax_rate',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
      changes: { name: { old: null, new: data.name }, rate: { old: null, new: data.rate } },
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTaxRate(id: string, data: {
  name?: string;
  countryId?: string;
  rate?: number;
  type?: 'percentage' | 'fixed';
  isDefault?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const updated = await settingsService.updateTaxRate(id, data);
    await auditService.logAction({
      action: 'tax_rate.updated',
      entityType: 'tax_rate',
      entityId: id,
      entityLabel: data.name ?? 'Tax Rate',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTaxRate(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.deleteTaxRate(id);
    await auditService.logAction({
      action: 'tax_rate.deleted',
      entityType: 'tax_rate',
      entityId: id,
      entityLabel: 'Tax Rate',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreTaxRate(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.restoreTaxRate(id);
    await auditService.logAction({
      action: 'tax_rate.restored',
      entityType: 'tax_rate',
      entityId: id,
      entityLabel: 'Tax Rate',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}
