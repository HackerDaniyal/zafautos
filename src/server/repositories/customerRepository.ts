import {
  customerAddresses,
  customerAlerts,
  customerProfiles,
  customers,
  customerSettings,
  customerWishlist,
  orders,
  payments,
  shipments,
  documents,
  users,
  profiles,
} from '@/server/db/schema';
import { type InferModel, eq, and, or, like, sql, desc, asc, type SQL, type SQLWrapper } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { db } from '@/server/db/client';
import type { PaginatedResult } from './baseRepository';

export class CustomerRepository {
  public readonly customers = new BaseRepository(customers);
  public readonly addresses = new BaseRepository(customerAddresses);
  public readonly alerts = new BaseRepository(customerAlerts);
  public readonly profiles = new BaseRepository(customerProfiles);
  public readonly settings = new BaseRepository(customerSettings);
  public readonly wishlist = new BaseRepository(customerWishlist);

  async findByUserId(userId: string) {
    const [customer] = await this.customers.getClient()
      .select()
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1);

    return customer ?? null;
  }

  async listCustomers(options: {
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
    conditions.push(sql`${customers.deletedAt} IS NULL`);

    if (status) {
      conditions.push(sql`${users.status} = ${status}`);
    }

    if (countryId) {
      conditions.push(sql`${profiles.countryId} = ${countryId}`);
    }

    if (dateFrom) {
      conditions.push(sql`${customers.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${customers.createdAt} <= ${dateTo}`);
    }

    if (search) {
      conditions.push(or(
        like(profiles.firstName, `%${search}%`),
        like(profiles.lastName, `%${search}%`),
        like(users.email, `%${search}%`),
        like(customerProfiles.displayName, `%${search}%`),
        like(profiles.phone, `%${search}%`),
      )!);
    }

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(customerProfiles, eq(customers.id, customerProfiles.customerId))
      .where(whereClause);

    const query = db
      .select({
        id: customers.id,
        userId: customers.userId,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        email: users.email,
        status: users.status,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        displayName: customerProfiles.displayName,
        phone: profiles.phone,
        countryId: profiles.countryId,
        avatarUrl: profiles.avatarUrl,
        orderCount: sql<number>`(SELECT COUNT(*)::int FROM ${orders} WHERE ${orders.customerId} = ${customers.id} AND ${orders.deletedAt} IS NULL)`,
        totalSpent: sql<number>`(SELECT COALESCE(SUM(${orders.totalAmount}), 0)::int FROM ${orders} WHERE ${orders.customerId} = ${customers.id} AND ${orders.deletedAt} IS NULL)`,
        lastOrderDate: sql<Date | null>`(SELECT MAX(${orders.createdAt}) FROM ${orders} WHERE ${orders.customerId} = ${customers.id} AND ${orders.deletedAt} IS NULL)`,
      })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .leftJoin(customerProfiles, eq(customers.id, customerProfiles.customerId))
      .where(whereClause);

    const sortCol = sortColumn ? (query as unknown as Record<string, SQLWrapper>)[sortColumn] : undefined;
    let sortedQuery;
    if (sortCol) {
      const sortFn = sortDirection === 'asc' ? asc : desc;
      sortedQuery = query.orderBy(sortFn(sortCol));
    } else {
      sortedQuery = query.orderBy(desc(customers.createdAt));
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

  async getCustomerWithDetails(customerId: string) {
    const customerResult = await db
      .select({
        id: customers.id,
        userId: customers.userId,
        createdAt: customers.createdAt,
        updatedAt: customers.updatedAt,
        createdBy: customers.createdBy,
        updatedBy: customers.updatedBy,
        deletedAt: customers.deletedAt,
        deletedBy: customers.deletedBy,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    const customer = customerResult[0];
    if (!customer) return null;

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, customer.userId))
      .limit(1);

    const user = userResult[0];

    const profileResult = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, customer.userId))
      .limit(1);

    const profile = profileResult[0] ?? null;

    const customerProfileResult = await db
      .select()
      .from(customerProfiles)
      .where(eq(customerProfiles.customerId, customerId))
      .limit(1);

    const customerProfile = customerProfileResult[0] ?? null;

    const addressList = await db
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.createdAt));

    const settingsResult = await db
      .select()
      .from(customerSettings)
      .where(eq(customerSettings.customerId, customerId))
      .limit(1);

    const settings = settingsResult[0] ?? null;

    const ordersList = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));

    const paymentsList = await db
      .select()
      .from(payments)
      .where(sql`${payments.userId} = ${customer.userId}`)
      .orderBy(desc(payments.createdAt));

    const shipmentsList = await db
      .select()
      .from(shipments)
      .where(sql`${shipments.orderId} IN (SELECT ${orders.id} FROM ${orders} WHERE ${orders.customerId} = ${customerId})`)
      .orderBy(desc(shipments.createdAt));

    const wishlistList = await db
      .select()
      .from(customerWishlist)
      .where(eq(customerWishlist.customerId, customerId))
      .orderBy(desc(customerWishlist.createdAt));

    const documentsList = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, customer.userId))
      .orderBy(desc(documents.createdAt));

    const alertsList = await db
      .select()
      .from(customerAlerts)
      .where(eq(customerAlerts.customerId, customerId))
      .orderBy(desc(customerAlerts.createdAt));

    return {
      ...customer,
      email: user?.email ?? '',
      status: user?.status ?? 'active',
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
      displayName: customerProfile?.displayName ?? null,
      phone: profile?.phone ?? null,
      countryId: profile?.countryId ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      timezone: profile?.timezone ?? null,
      languageId: profile?.languageId ?? null,
      profile: customerProfile,
      addresses: addressList,
      settings,
      orders: ordersList,
      payments: paymentsList,
      shipments: shipmentsList,
      wishlist: wishlistList,
      documents: documentsList,
      alerts: alertsList,
    };
  }

  async getCustomerStats() {
    const statusCounts = await db
      .select({
        status: users.status,
        count: sql<number>`count(*)::int`,
      })
      .from(customers)
      .innerJoin(users, eq(customers.userId, users.id))
      .where(sql`${customers.deletedAt} IS NULL`)
      .groupBy(users.status);

    const totalCustomers = statusCounts.reduce((sum, row) => sum + row.count, 0);
    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
    }

    const [{ totalOrders }] = await db
      .select({ totalOrders: sql<number>`count(*)::int` })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL`);

    const [{ totalRevenue }] = await db
      .select({ totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int` })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL`);

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [{ newThisMonth }] = await db
      .select({ newThisMonth: sql<number>`count(*)::int` })
      .from(customers)
      .where(sql`${customers.deletedAt} IS NULL AND ${customers.createdAt} >= ${thirtyDaysAgo}`);

    const [{ returningCustomers }] = await db
      .select({ returningCustomers: sql<number>`count(distinct ${orders.customerId})::int` })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL AND ${orders.customerId} IS NOT NULL`);

    return {
      totalCustomers,
      activeCustomers: statusMap['active'] ?? 0,
      pendingCustomers: statusMap['pending'] ?? 0,
      suspendedCustomers: statusMap['suspended'] ?? 0,
      blockedCustomers: statusMap['blocked'] ?? 0,
      newThisMonth,
      returningCustomers,
      totalOrders,
      totalRevenue,
      avgOrderValue,
    };
  }

  async getWishlist(customerId: string) {
    return this.wishlist.getClient()
      .select()
      .from(customerWishlist)
      .where(eq(customerWishlist.customerId, customerId));
  }

  async addWishlistEntry(customerId: string, vehicleId: string) {
    return this.wishlist.create({ customerId, vehicleId });
  }

  async removeWishlistEntry(customerId: string, vehicleId: string) {
    return this.wishlist.getClient()
      .delete(customerWishlist)
      .where(
        and(
          eq(customerWishlist.customerId, customerId),
          eq(customerWishlist.vehicleId, vehicleId),
        ),
      );
  }

  async getAddresses(customerId: string) {
    return this.addresses.getClient()
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId));
  }

  async createAddress(data: InferModel<typeof customerAddresses, 'insert'>) {
    return this.addresses.create(data);
  }

  async createAlert(data: InferModel<typeof customerAlerts, 'insert'>) {
    return this.alerts.create(data);
  }

  async updateSettings(customerId: string, data: Partial<InferModel<typeof customerSettings, 'insert'>>) {
    const [settings] = await this.settings.getClient()
      .update(customerSettings)
      .set(data)
      .where(eq(customerSettings.customerId, customerId))
      .returning();

    return settings ?? null;
  }

  async updateUserStatus(userId: string, status: string) {
    const [updated] = await db
      .update(users)
      .set({ status: status as typeof users.$inferSelect.status })
      .where(eq(users.id, userId))
      .returning();

    return updated ?? null;
  }

  async softDeleteCustomer(customerId: string, deletedBy?: string) {
    const [updated] = await db
      .update(customers)
      .set({
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      })
      .where(eq(customers.id, customerId))
      .returning();

    return updated ?? null;
  }

  async restoreCustomer(customerId: string) {
    const [updated] = await db
      .update(customers)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(customers.id, customerId))
      .returning();

    return updated ?? null;
  }
}
