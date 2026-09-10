import {
  dealers,
  dealerProfiles,
  dealerAssignments,
  dealerActivity,
  orders,
  shipments,
  documents,
  users,
  profiles,
} from '@/server/db/schema';
import { eq, sql, and, or, like, desc, asc, type SQL, type SQLWrapper } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { db } from '@/server/db/client';
import type { PaginatedResult } from './baseRepository';

export class DealerRepository {
  public readonly dealers = new BaseRepository(dealers);
  public readonly profiles = new BaseRepository(dealerProfiles);
  public readonly assignments = new BaseRepository(dealerAssignments);
  public readonly activity = new BaseRepository(dealerActivity);

  async findByUserId(userId: string) {
    const [dealer] = await this.dealers.getClient()
      .select()
      .from(dealers)
      .where(eq(dealers.userId, userId))
      .limit(1);

    return dealer ?? null;
  }

  async getDealerForEdit(dealerId: string) {
    const [result] = await this.dealers.getClient()
      .select({
        id: dealers.id,
        email: users.email,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        displayName: dealerProfiles.displayName,
        phone: profiles.phone,
        status: users.status,
      })
      .from(dealers)
      .leftJoin(users, eq(dealers.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(dealerProfiles, eq(dealers.id, dealerProfiles.dealerId))
      .where(eq(dealers.id, dealerId))
      .limit(1);

    return result ?? null;
  }

  async listDealers(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    countryId?: string;
    dateFrom?: string;
    dateTo?: string;
    hasOrders?: boolean;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page = 1, limit = 20, search, status, countryId, dateFrom, dateTo, hasOrders, sortColumn, sortDirection } = options;

    const conditions: SQL[] = [];
    conditions.push(sql`${dealers.deletedAt} IS NULL`);

    if (status) {
      conditions.push(sql`${users.status} = ${status}`);
    }

    if (countryId) {
      conditions.push(sql`${profiles.countryId} = ${countryId}`);
    }

    if (dateFrom) {
      conditions.push(sql`${dealers.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${dealers.createdAt} <= ${dateTo}`);
    }

    if (search) {
      conditions.push(or(
        like(profiles.firstName, `%${search}%`),
        like(profiles.lastName, `%${search}%`),
        like(users.email, `%${search}%`),
        like(dealerProfiles.displayName, `%${search}%`),
        like(profiles.phone, `%${search}%`),
      )!);
    }

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dealers)
      .innerJoin(users, eq(dealers.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(dealerProfiles, eq(dealers.id, dealerProfiles.dealerId))
      .where(whereClause);

    const query = db
      .select({
        id: dealers.id,
        userId: dealers.userId,
        createdAt: dealers.createdAt,
        updatedAt: dealers.updatedAt,
        email: users.email,
        status: users.status,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        displayName: dealerProfiles.displayName,
        phone: profiles.phone,
        countryId: profiles.countryId,
        avatarUrl: profiles.avatarUrl,
        orderCount: sql<number>`(SELECT COUNT(*)::int FROM ${orders} WHERE ${orders.dealerId} = ${dealers.id} AND ${orders.deletedAt} IS NULL)`,
        totalRevenue: sql<number>`(SELECT COALESCE(SUM(${orders.totalAmount}), 0)::int FROM ${orders} WHERE ${orders.dealerId} = ${dealers.id} AND ${orders.deletedAt} IS NULL)`,
        lastOrderDate: sql<Date | null>`(SELECT MAX(${orders.createdAt}) FROM ${orders} WHERE ${orders.dealerId} = ${dealers.id} AND ${orders.deletedAt} IS NULL)`,
      })
      .from(dealers)
      .innerJoin(users, eq(dealers.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(dealerProfiles, eq(dealers.id, dealerProfiles.dealerId))
      .where(whereClause);

    if (hasOrders) {
      const havingClause = sql`(SELECT COUNT(*)::int FROM ${orders} WHERE ${orders.dealerId} = ${dealers.id} AND ${orders.deletedAt} IS NULL) > 0`;
      // Apply hasOrders filter to both count and query
    }

    const sortCol = sortColumn ? (query as unknown as Record<string, SQLWrapper>)[sortColumn] : undefined;
    let sortedQuery;
    if (sortCol) {
      const sortFn = sortDirection === 'asc' ? asc : desc;
      sortedQuery = query.orderBy(sortFn(sortCol));
    } else {
      sortedQuery = query.orderBy(desc(dealers.createdAt));
    }

    const offset = (page - 1) * limit;
    const data = await sortedQuery.limit(limit).offset(offset);

    return {
      data,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getDealerWithDetails(dealerId: string) {
    const dealerResult = await db
      .select({
        id: dealers.id,
        userId: dealers.userId,
        createdAt: dealers.createdAt,
        updatedAt: dealers.updatedAt,
        createdBy: dealers.createdBy,
        updatedBy: dealers.updatedBy,
        deletedAt: dealers.deletedAt,
        deletedBy: dealers.deletedBy,
      })
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    const dealer = dealerResult[0];
    if (!dealer) return null;

    const [
      userResult,
      profileResult,
      dealerProfileResult,
      ordersList,
      shipmentsList,
      assignmentsList,
      documentsList,
      activityList,
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, dealer.userId)).limit(1),
      db.select().from(profiles).where(eq(profiles.userId, dealer.userId)).limit(1),
      db.select().from(dealerProfiles).where(eq(dealerProfiles.dealerId, dealerId)).limit(1),
      db.select().from(orders).where(eq(orders.dealerId, dealerId)).orderBy(desc(orders.createdAt)),
      db.select().from(shipments).where(sql`${shipments.orderId} IN (SELECT ${orders.id} FROM ${orders} WHERE ${orders.dealerId} = ${dealerId})`).orderBy(desc(shipments.createdAt)),
      db.select().from(dealerAssignments).where(eq(dealerAssignments.dealerId, dealerId)).orderBy(desc(dealerAssignments.createdAt)),
      db.select().from(documents).where(eq(documents.userId, dealer.userId)).orderBy(desc(documents.createdAt)),
      db.select().from(dealerActivity).where(eq(dealerActivity.dealerId, dealerId)).orderBy(desc(dealerActivity.createdAt)),
    ]);

    const user = userResult[0];
    const profile = profileResult[0] ?? null;
    const dealerProfile = dealerProfileResult[0] ?? null;

    return {
      ...dealer,
      email: user?.email ?? '',
      status: user?.status ?? 'active',
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      displayName: dealerProfile?.displayName ?? null,
      phone: profile?.phone ?? null,
      countryId: profile?.countryId ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      profile: dealerProfile,
      orders: ordersList,
      shipments: shipmentsList,
      assignments: assignmentsList,
      documents: documentsList,
      activity: activityList,
    };
  }

  async getDealerStats() {
    const statusCounts = await db
      .select({
        status: users.status,
        count: sql<number>`count(*)::int`,
      })
      .from(dealers)
      .innerJoin(users, eq(dealers.userId, users.id))
      .where(sql`${dealers.deletedAt} IS NULL`)
      .groupBy(users.status);

    const totalDealers = statusCounts.reduce((sum, row) => sum + row.count, 0);
    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newThisMonthRow, totalOrdersRow, totalRevenueRow] = await Promise.all([
      db.select({ newThisMonth: sql<number>`count(*)::int` })
        .from(dealers)
        .where(sql`${dealers.deletedAt} IS NULL AND ${dealers.createdAt} >= ${thirtyDaysAgo}`)
        .then((rows) => rows[0]),
      db.select({ totalOrders: sql<number>`count(*)::int` })
        .from(orders)
        .where(sql`${orders.deletedAt} IS NULL AND ${orders.dealerId} IS NOT NULL`)
        .then((rows) => rows[0]),
      db.select({ totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int` })
        .from(orders)
        .where(sql`${orders.deletedAt} IS NULL AND ${orders.dealerId} IS NOT NULL`)
        .then((rows) => rows[0]),
    ]);

    const newThisMonth = newThisMonthRow.newThisMonth;
    const totalOrders = totalOrdersRow.totalOrders;
    const totalRevenue = totalRevenueRow.totalRevenue;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalDealers,
      activeDealers: statusMap['active'] ?? 0,
      pendingDealers: statusMap['pending'] ?? 0,
      suspendedDealers: statusMap['suspended'] ?? 0,
      archivedDealers: statusMap['archived'] ?? 0,
      newThisMonth,
      totalOrders,
      totalRevenue,
      avgOrderValue,
    };
  }

  async updateUserStatus(userId: string, status: string) {
    const [updated] = await db
      .update(users)
      .set({ status: status as typeof users.$inferSelect.status })
      .where(eq(users.id, userId))
      .returning();

    return updated ?? null;
  }

  async softDeleteDealer(dealerId: string, deletedBy?: string) {
    const [updated] = await db
      .update(dealers)
      .set({
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      })
      .where(eq(dealers.id, dealerId))
      .returning();

    return updated ?? null;
  }

  async restoreDealer(dealerId: string) {
    const [updated] = await db
      .update(dealers)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(dealers.id, dealerId))
      .returning();

    return updated ?? null;
  }

  async assignOrder(data: { dealerId: string; orderId: string }) {
    return this.assignments.create(data);
  }

  async getAssignments(dealerId: string) {
    return this.assignments.getClient()
      .select()
      .from(dealerAssignments)
      .where(eq(dealerAssignments.dealerId, dealerId));
  }

  async logActivity(data: { dealerId: string; activity: string }) {
    return this.activity.create(data);
  }
}
