import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { auditLogs, users, profiles } from '@/server/db/schema';

export type AuditLogInsert = typeof auditLogs.$inferInsert;

export interface AuditLogFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface PaginatedAuditResult {
  data: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    entityLabel: string | null;
    userId: string | null;
    changes: unknown;
    metadata: unknown;
    createdAt: Date;
    userFirstName: string | null;
    userLastName: string | null;
    userEmail: string | null;
  }>;
  total: number;
  page: number;
  limit: number;
}

export class AuditRepository extends BaseRepository<typeof auditLogs> {
  constructor() {
    super(auditLogs);
  }

  async log(data: AuditLogInsert) {
    return this.getClient().insert(auditLogs).values(data).returning().then((rows) => rows[0]);
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.getClient()
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
      .orderBy(desc(auditLogs.createdAt));
  }

  async findRecent(limit: number = 50) {
    return this.getClient()
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async findByUser(userId: string) {
    return this.getClient()
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt));
  }

  async findById(id: string) {
    const [row] = await this.getClient()
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        entityLabel: auditLogs.entityLabel,
        userId: auditLogs.userId,
        changes: auditLogs.changes,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userFirstName: profiles.firstName,
        userLastName: profiles.lastName,
        userEmail: users.email,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(auditLogs.id, id))
      .limit(1);

    return row ?? null;
  }

  async findPaginated(
    filters: AuditLogFilters,
    page: number = 1,
    limit: number = 25,
  ): Promise<PaginatedAuditResult> {
    const conditions: SQL[] = [];

    if (filters.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters.from) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filters.from}`);
    }
    if (filters.to) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.to}`);
    }
    if (filters.search) {
      conditions.push(sql`${auditLogs.entityLabel} ILIKE ${'%' + filters.search + '%'}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [data, [{ count: total }]] = await Promise.all([
      this.getClient()
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          entityLabel: auditLogs.entityLabel,
          userId: auditLogs.userId,
          changes: auditLogs.changes,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
          userFirstName: profiles.firstName,
          userLastName: profiles.lastName,
          userEmail: users.email,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .leftJoin(profiles, eq(users.id, profiles.userId))
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      this.getClient()
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(whereClause),
    ]);

    return { data, total, page, limit };
  }
}
