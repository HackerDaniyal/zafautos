import { eq, and, desc } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { auditLogs } from '@/server/db/schema';

export type AuditLogInsert = typeof auditLogs.$inferInsert;

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
}
