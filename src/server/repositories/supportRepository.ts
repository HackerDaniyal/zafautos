import {
  supportTickets,
  supportTicketMessages,
} from '@/server/db/schema';
import {
  type InferModel,
  eq, and, or, like, sql, desc, asc, count,
  type SQL,
} from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { db } from '@/server/db/client';
import type { PaginatedResult, PaginationOptions, SortOptions } from './baseRepository';

export interface TicketFilterOptions {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  customerId?: string;
  search?: string;
}

export class SupportRepository {
  public readonly tickets = new BaseRepository(supportTickets);
  public readonly messages = new BaseRepository(supportTicketMessages);

  async findById(id: string) {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.deletedAt, null as unknown as Date)))
      .limit(1);
    return ticket ?? null;
  }

  async findTicketWithRelations(id: string) {
    const [ticket] = await db
      .select({
        id: supportTickets.id,
        customerId: supportTickets.customerId,
        orderId: supportTickets.orderId,
        subject: supportTickets.subject,
        description: supportTickets.description,
        category: supportTickets.category,
        priority: supportTickets.priority,
        status: supportTickets.status,
        assignedTo: supportTickets.assignedTo,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        closedAt: supportTickets.closedAt,
      })
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.deletedAt, null as unknown as Date)))
      .limit(1);

    return ticket ?? null;
  }

  async listTickets(
    filters: TicketFilterOptions,
    pagination: PaginationOptions = {},
    sort: SortOptions = {}
  ): Promise<PaginatedResult<typeof supportTickets.$inferSelect>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(supportTickets.deletedAt, null as unknown as Date)];

    if (filters.status) conditions.push(eq(supportTickets.status, filters.status as any));
    if (filters.priority) conditions.push(eq(supportTickets.priority, filters.priority as any));
    if (filters.category) conditions.push(eq(supportTickets.category, filters.category as any));
    if (filters.assignedTo) conditions.push(eq(supportTickets.assignedTo, filters.assignedTo));
    if (filters.customerId) conditions.push(eq(supportTickets.customerId, filters.customerId));

    if (filters.search) {
      conditions.push(
        or(
          like(supportTickets.subject, `%${filters.search}%`),
          like(supportTickets.description, `%${filters.search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);
    const sortColumn = sort.column === 'priority' ? supportTickets.priority
      : sort.column === 'status' ? supportTickets.status
      : sort.column === 'updatedAt' ? supportTickets.updatedAt
      : supportTickets.createdAt;
    const sortDir = sort.direction === 'asc' ? asc : desc;

    const [{ total }] = await db
      .select({ total: count() })
      .from(supportTickets)
      .where(whereClause);

    const data = await db
      .select()
      .from(supportTickets)
      .where(whereClause)
      .orderBy(sortDir(sortColumn))
      .limit(limit)
      .offset(offset);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketMessages(ticketId: string) {
    return db
      .select()
      .from(supportTicketMessages)
      .where(and(
        eq(supportTicketMessages.ticketId, ticketId),
        eq(supportTicketMessages.deletedAt, null as unknown as Date)
      ))
      .orderBy(asc(supportTicketMessages.createdAt));
  }

  async createTicket(data: typeof supportTickets.$inferInsert) {
    const [ticket] = await db.insert(supportTickets).values(data).returning();
    return ticket;
  }

  async updateTicket(id: string, data: Partial<typeof supportTickets.$inferInsert>) {
    const [ticket] = await db
      .update(supportTickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return ticket;
  }

  async addMessage(data: typeof supportTicketMessages.$inferInsert) {
    const [message] = await db.insert(supportTicketMessages).values(data).returning();
    // Update ticket updated_at
    await db
      .update(supportTickets)
      .set({ updatedAt: new Date() })
      .where(eq(supportTickets.id, data.ticketId));
    return message;
  }

  async countByStatus(customerId?: string) {
    const conditions: SQL[] = [eq(supportTickets.deletedAt, null as unknown as Date)];
    if (customerId) conditions.push(eq(supportTickets.customerId, customerId));

    const results = await db
      .select({
        status: supportTickets.status,
        count: count(),
      })
      .from(supportTickets)
      .where(and(...conditions))
      .groupBy(supportTickets.status);

    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.status] = r.count;
    }
    return counts;
  }

  async countUnreadMessages(ticketId: string, userId: string) {
    const [result] = await db
      .select({ count: count() })
      .from(supportTicketMessages)
      .where(and(
        eq(supportTicketMessages.ticketId, ticketId),
        eq(supportTicketMessages.deletedAt, null as unknown as Date),
      ));
    return result?.count ?? 0;
  }
}
