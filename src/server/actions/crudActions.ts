'use server';

import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema';
import { DomainError } from '@/server/services/errors';
import type { ActionResult, PaginatedResult, ListParams } from '@/types/crud';

interface CrudActionConfig<T, TCreate> {
  entityName: string;
  repository: {
    findMany: (options: {
      filters?: Record<string, unknown>;
      pagination?: { page?: number; limit?: number };
      sort?: { column?: string; direction?: 'asc' | 'desc' };
    }) => Promise<{ data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
    findById: (id: string) => Promise<T | null>;
    create: (data: TCreate) => Promise<T>;
    update: (id: string, data: Partial<TCreate>) => Promise<T>;
    delete: (id: string) => Promise<void>;
  };
  auditLog?: {
    entityType: string;
    getEntityLabel: (entity: T) => string;
  };
  schemas?: {
    create?: z.ZodSchema<TCreate>;
    update?: z.ZodSchema<Partial<TCreate>>;
  };
}

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

async function writeAuditLog<T>(
  auditConfig: { entityType: string; getEntityLabel: (entity: T) => string },
  action: string,
  entity: T,
  userId: string,
  changes?: Record<string, unknown>,
) {
  try {
    await db.insert(auditLogs).values({
      action,
      entityType: auditConfig.entityType,
      entityId: (entity as unknown as { id: string }).id,
      entityLabel: auditConfig.getEntityLabel(entity),
      userId,
      changes: changes ?? null,
    });
  } catch {
    // Audit log failures should not break the main action
  }
}

function createCrudActions<T extends { id: string }, TCreate>(config: CrudActionConfig<T, TCreate>) {
  const { entityName, repository, auditLog, schemas } = config;

  return {
    async list(params: ListParams): Promise<ActionResult<PaginatedResult<T>>> {
      try {
        await requireAuth();

        const result = await repository.findMany({
          filters: params.filters,
          pagination: { page: params.page, limit: params.limit },
          sort: params.sort,
        });

        return { success: true, data: result };
      } catch (error) {
        return handleError(error);
      }
    },

    async get(id: string): Promise<ActionResult<T>> {
      try {
        await requireAuth();
        UUIDSchema.parse(id);

        const entity = await repository.findById(id);
        if (!entity) {
          return {
            success: false,
            error: `${entityName} not found`,
            code: 'NOT_FOUND',
          };
        }

        return { success: true, data: entity };
      } catch (error) {
        return handleError(error);
      }
    },

    async create(data: TCreate): Promise<ActionResult<T>> {
      try {
        const auth = await requireAuth();

        const validated = schemas?.create ? schemas.create.parse(data) : data;
        const entity = await repository.create(validated);

        if (auditLog) {
          await writeAuditLog(auditLog, 'create', entity, auth.userId);
        }

        return { success: true, data: entity };
      } catch (error) {
        return handleError(error);
      }
    },

    async update(id: string, data: Partial<TCreate>): Promise<ActionResult<T>> {
      try {
        const auth = await requireAuth();
        UUIDSchema.parse(id);

        const existing = await repository.findById(id);
        if (!existing) {
          return {
            success: false,
            error: `${entityName} not found`,
            code: 'NOT_FOUND',
          };
        }

        const validated = schemas?.update ? schemas.update.parse(data) : data;
        const entity = await repository.update(id, validated);

        if (auditLog) {
          await writeAuditLog(auditLog, 'update', entity, auth.userId, data as Record<string, unknown>);
        }

        return { success: true, data: entity };
      } catch (error) {
        return handleError(error);
      }
    },

    async remove(id: string): Promise<ActionResult<void>> {
      try {
        const auth = await requireAuth();
        UUIDSchema.parse(id);

        const existing = await repository.findById(id);
        if (!existing) {
          return {
            success: false,
            error: `${entityName} not found`,
            code: 'NOT_FOUND',
          };
        }

        await repository.delete(id);

        if (auditLog) {
          await writeAuditLog(auditLog, 'delete', existing, auth.userId);
        }

        return { success: true, data: undefined };
      } catch (error) {
        return handleError(error);
      }
    },
  };
}

export { createCrudActions, type CrudActionConfig };
