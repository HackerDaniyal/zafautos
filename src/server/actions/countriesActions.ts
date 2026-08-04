'use server';

import { requireAuth } from '@/lib/auth';
import { SettingsService } from '@/server/services';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const settingsService = new SettingsService();
const auditService = new AuditService();

export async function listCountries(options: {
  page?: number;
  limit?: number;
  search?: string;
  continentId?: string;
  isActive?: boolean;
  sort?: { column?: string; direction?: 'asc' | 'desc' };
} = {}): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listCountries(options);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function listActiveCountries(): Promise<ActionResult> {
  try {
    const data = await settingsService.listActiveCountries();
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function getCountry(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.getCountry(id);
    return { success: true, data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createCountry(data: {
  name: string;
  slug?: string;
  flagImage?: string;
  currencyId?: string;
  continentId?: string;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const created = await settingsService.createCountry({
      name: data.name,
      slug: data.slug,
      flagImage: data.flagImage,
      currencyId: data.currencyId,
      continentId: data.continentId,
      isActive: data.isActive ?? true,
      displayOrder: data.displayOrder ?? 0,
    });
    await auditService.logAction({
      action: 'country.created',
      entityType: 'country',
      entityId: (created as { id: string }).id,
      entityLabel: data.name,
      changes: { name: { old: null, new: data.name } },
    });
    return { success: true, data: created };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCountry(id: string, data: {
  name?: string;
  slug?: string;
  flagImage?: string;
  currencyId?: string;
  continentId?: string;
  isActive?: boolean;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    await requireAuth();
    const updated = await settingsService.updateCountry(id, data);
    await auditService.logAction({
      action: 'country.updated',
      entityType: 'country',
      entityId: id,
      entityLabel: data.name ?? 'Country',
      changes: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, { old: null, new: v }])
      ),
    });
    return { success: true, data: updated };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCountry(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.deleteCountry(id);
    await auditService.logAction({
      action: 'country.deleted',
      entityType: 'country',
      entityId: id,
      entityLabel: 'Country',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function restoreCountry(id: string): Promise<ActionResult> {
  try {
    await requireAuth();
    await settingsService.restoreCountry(id);
    await auditService.logAction({
      action: 'country.restored',
      entityType: 'country',
      entityId: id,
      entityLabel: 'Country',
    });
    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function initializeReferenceData(): Promise<ActionResult> {
  try {
    await requireAuth();
    const result = await settingsService.initializeReferenceData();
    await auditService.logAction({
      action: 'country.initialized',
      entityType: 'country',
      entityId: 'bulk',
      entityLabel: 'Initialize Reference Data',
      changes: {
        continentsCreated: { old: null, new: result.continentsCreated },
        currenciesCreated: { old: null, new: result.currenciesCreated },
        countriesCreated: { old: null, new: result.countriesCreated },
        countriesUpdated: { old: null, new: result.countriesUpdated },
        countriesSkipped: { old: null, new: result.countriesSkipped },
        durationMs: { old: null, new: result.durationMs },
      },
    });
    return { success: true, data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function listActiveContinents(): Promise<ActionResult> {
  try {
    await requireAuth();
    const data = await settingsService.listActiveContinents();
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
