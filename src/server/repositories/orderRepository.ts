import {
  orders,
  orderItems,
  orderStatus,
  orderTimeline,
  orderDocuments,
  orderNotes,
  customers,
  customerProfiles,
  dealers,
  dealerProfiles,
  dealerAssignments,
  vehicles,
  vehicleImages,
  payments,
  shipments,
} from '@/server/db/schema';
import { type InferModel, eq, and, or, like, sql, desc, asc, type SQL } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import type { PaginatedResult, PaginationOptions, SortOptions } from './baseRepository';

export interface OrderFilterOptions {
  status?: string;
  customerId?: string;
  dealerId?: string;
  vehicleId?: string;
  search?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class OrderRepository {
  public readonly orders = new BaseRepository(orders);
  public readonly orderItems = new BaseRepository(orderItems);

  async findByOrderNumber(orderNumber: string) {
    const [order] = await this.orders.getClient()
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    return order ?? null;
  }

  async findByCustomer(customerId: string) {
    return this.orders.getClient()
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId));
  }

  async findByDealer(dealerId: string) {
    return this.orders.getClient()
      .select()
      .from(orders)
      .where(eq(orders.dealerId, dealerId));
  }

  async createOrder(data: InferModel<typeof orders, 'insert'>) {
    return this.orders.create(data);
  }

  async addOrderItem(data: InferModel<typeof orderItems, 'insert'>) {
    return this.orderItems.create(data);
  }

  async updateOrderStatus(orderId: string, status: InferModel<typeof orders, 'insert'>['status']) {
    const [order] = await this.orders.getClient()
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();

    return order ?? null;
  }

  async listOrders(options: {
    filters?: OrderFilterOptions;
    pagination?: PaginationOptions;
    sort?: SortOptions;
  } = {}): Promise<PaginatedResult<typeof orders.$inferSelect & {
    customerName: string | null;
    dealerName: string | null;
    vehicleTitle: string | null;
    vehicleVin: string | null;
    vehicleStockNumber: string | null;
    vehiclePrimaryImage: string | null;
  }>> {
    const { filters, pagination, sort } = options;
    const { page = 1, limit = 20 } = pagination ?? {};
    const { column: sortCol, direction = 'desc' } = sort ?? {};

    const conditions: SQL[] = [sql`${orders.deletedAt} IS NULL`];

    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status as typeof orders.$inferSelect.status));
    }
    if (filters?.customerId) {
      conditions.push(eq(orders.customerId, filters.customerId));
    }
    if (filters?.dealerId) {
      conditions.push(eq(orders.dealerId, filters.dealerId));
    }
    if (filters?.vehicleId) {
      conditions.push(eq(orders.vehicleId, filters.vehicleId));
    }
    if (filters?.search) {
      conditions.push(like(orders.orderNumber, `%${filters.search}%`));
    }
    if (filters?.dateFrom) {
      conditions.push(sql`${orders.createdAt} >= ${filters.dateFrom}`);
    }
    if (filters?.dateTo) {
      conditions.push(sql`${orders.createdAt} <= ${filters.dateTo}`);
    }

    if (filters?.paymentStatus) {
      const paidOrderIds = this.orders.getClient()
        .select({ orderId: payments.orderId })
        .from(payments)
        .where(and(
          eq(payments.status, filters.paymentStatus as typeof payments.$inferSelect.status),
          sql`${payments.deletedAt} IS NULL`,
        ));
      conditions.push(sql`${orders.id} IN (${paidOrderIds})`);
    }

    if (filters?.shippingStatus) {
      const shippedOrderIds = this.orders.getClient()
        .select({ orderId: shipments.orderId })
        .from(shipments)
        .where(and(
          eq(shipments.status, filters.shippingStatus as typeof shipments.$inferSelect.status),
          sql`${shipments.deletedAt} IS NULL`,
        ));
      conditions.push(sql`${orders.id} IN (${shippedOrderIds})`);
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.orders.getClient()
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const sortFn = direction === 'asc' ? asc : desc;
    const sortColumn = sortCol && (orders as unknown as Record<string, unknown>)[sortCol]
      ? (orders as unknown as Record<string, unknown>)[sortCol]
      : orders.createdAt;

    const orderRows = await this.orders.getClient()
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(sortFn(sortColumn as Parameters<typeof sortFn>[0]))
      .limit(limit)
      .offset((page - 1) * limit);

    const customerIds = orderRows.map((o) => o.customerId).filter((id): id is string => !!id);
    const dealerIds = orderRows.map((o) => o.dealerId).filter((id): id is string => !!id);
    const vehicleIds = orderRows.map((o) => o.vehicleId).filter((id): id is string => !!id);

    const [customerProfilesRows, dealerProfilesRows, vehicleRows, primaryImages] = await Promise.all([
      customerIds.length > 0
        ? this.orders.getClient()
            .select({ customerId: customerProfiles.customerId, displayName: customerProfiles.displayName })
            .from(customerProfiles)
            .where(and(
              sql`${customerProfiles.customerId} = ANY(${customerIds})`,
              sql`${customerProfiles.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { customerId: string; displayName: string | null }[]),
      dealerIds.length > 0
        ? this.orders.getClient()
            .select({ dealerId: dealerProfiles.dealerId, displayName: dealerProfiles.displayName })
            .from(dealerProfiles)
            .where(and(
              sql`${dealerProfiles.dealerId} = ANY(${dealerIds})`,
              sql`${dealerProfiles.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { dealerId: string; displayName: string | null }[]),
      vehicleIds.length > 0
        ? this.orders.getClient()
            .select({
              id: vehicles.id,
              vin: vehicles.vin,
              stockNumber: vehicles.stockNumber,
              manufacturerId: vehicles.manufacturerId,
              modelId: vehicles.modelId,
              year: vehicles.year,
            })
            .from(vehicles)
            .where(and(
              sql`${vehicles.id} = ANY(${vehicleIds})`,
              sql`${vehicles.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { id: string; vin: string | null; stockNumber: string | null; manufacturerId: string | null; modelId: string | null; year: number | null }[]),
      vehicleIds.length > 0
        ? this.orders.getClient()
            .select({ vehicleId: vehicleImages.vehicleId, imageUrl: vehicleImages.imageUrl })
            .from(vehicleImages)
            .where(and(
              sql`${vehicleImages.vehicleId} = ANY(${vehicleIds})`,
              sql`${vehicleImages.isPrimary} = true`,
              sql`${vehicleImages.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { vehicleId: string; imageUrl: string }[]),
    ]);

    const customerMap = new Map(customerProfilesRows.map((cp) => [cp.customerId, cp.displayName]));
    const dealerMap = new Map(dealerProfilesRows.map((dp) => [dp.dealerId, dp.displayName]));
    const vehicleMap = new Map(vehicleRows.map((v) => [v.id, v]));
    const imageMap = new Map(primaryImages.map((pi) => [pi.vehicleId, pi.imageUrl]));

    const enrichedData = orderRows.map((order) => {
      const vehicle = order.vehicleId ? vehicleMap.get(order.vehicleId) : undefined;
      let vehicleTitle: string | null = null;
      if (vehicle) {
        const parts: string[] = [];
        if (vehicle.year) parts.push(String(vehicle.year));
        if (vehicle.manufacturerId) parts.push(vehicle.manufacturerId);
        if (vehicle.modelId) parts.push(vehicle.modelId);
        vehicleTitle = parts.length > 0 ? parts.join(' ') : null;
      }

      return {
        ...order,
        customerName: order.customerId ? customerMap.get(order.customerId) ?? null : null,
        dealerName: order.dealerId ? dealerMap.get(order.dealerId) ?? null : null,
        vehicleTitle,
        vehicleVin: vehicle?.vin ?? null,
        vehicleStockNumber: vehicle?.stockNumber ?? null,
        vehiclePrimaryImage: order.vehicleId ? imageMap.get(order.vehicleId) ?? null : null,
      };
    });

    return {
      data: enrichedData,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getOrderWithRelations(orderId: string) {
    const rawOrder = await this.orders.findById(orderId);
    if (!rawOrder) return null;
    const order = rawOrder as unknown as typeof orders.$inferSelect;

    const [items, statusHistory, timeline, documents, notes, paymentsList, shipmentsList] = await Promise.all([
      this.orders.getClient()
        .select()
        .from(orderItems)
        .where(and(eq(orderItems.orderId, orderId), sql`${orderItems.deletedAt} IS NULL`)),
      this.orders.getClient()
        .select()
        .from(orderStatus)
        .where(and(eq(orderStatus.orderId, orderId), sql`${orderStatus.deletedAt} IS NULL`))
        .orderBy(desc(orderStatus.createdAt)),
      this.orders.getClient()
        .select()
        .from(orderTimeline)
        .where(and(eq(orderTimeline.orderId, orderId), sql`${orderTimeline.deletedAt} IS NULL`))
        .orderBy(desc(orderTimeline.createdAt)),
      this.orders.getClient()
        .select()
        .from(orderDocuments)
        .where(and(eq(orderDocuments.orderId, orderId), sql`${orderDocuments.deletedAt} IS NULL`)),
      this.orders.getClient()
        .select()
        .from(orderNotes)
        .where(and(eq(orderNotes.orderId, orderId), sql`${orderNotes.deletedAt} IS NULL`))
        .orderBy(desc(orderNotes.createdAt)),
      this.orders.getClient()
        .select()
        .from(payments)
        .where(and(eq(payments.orderId, orderId), sql`${payments.deletedAt} IS NULL`)),
      this.orders.getClient()
        .select()
        .from(shipments)
        .where(and(eq(shipments.orderId, orderId), sql`${shipments.deletedAt} IS NULL`)),
    ]);

    let customer = null;
    let customerProfile = null;
    if (order.customerId) {
      customer = await this.orders.getClient()
        .select()
        .from(customers)
        .where(and(eq(customers.id, order.customerId), sql`${customers.deletedAt} IS NULL`))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (customer) {
        customerProfile = await this.orders.getClient()
          .select()
          .from(customerProfiles)
          .where(and(eq(customerProfiles.customerId, customer.id), sql`${customerProfiles.deletedAt} IS NULL`))
          .limit(1)
          .then((rows) => rows[0] ?? null);
      }
    }

    let dealer = null;
    let dealerProfile = null;
    if (order.dealerId) {
      dealer = await this.orders.getClient()
        .select()
        .from(dealers)
        .where(and(eq(dealers.id, order.dealerId), sql`${dealers.deletedAt} IS NULL`))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (dealer) {
        dealerProfile = await this.orders.getClient()
          .select()
          .from(dealerProfiles)
          .where(and(eq(dealerProfiles.dealerId, dealer.id), sql`${dealerProfiles.deletedAt} IS NULL`))
          .limit(1)
          .then((rows) => rows[0] ?? null);
      }
    }

    let vehicle = null;
    let vehicleImagesList: typeof vehicleImages.$inferSelect[] = [];
    if (order.vehicleId) {
      vehicle = await this.orders.getClient()
        .select()
        .from(vehicles)
        .where(and(eq(vehicles.id, order.vehicleId), sql`${vehicles.deletedAt} IS NULL`))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      if (vehicle) {
        vehicleImagesList = await this.orders.getClient()
          .select()
          .from(vehicleImages)
          .where(and(eq(vehicleImages.vehicleId, vehicle.id), sql`${vehicleImages.deletedAt} IS NULL`))
          .orderBy(asc(vehicleImages.sortOrder));
      }
    }

    return {
      ...order,
      items,
      statusHistory,
      timeline,
      documents,
      notes,
      payments: paymentsList,
      shipments: shipmentsList,
      customer: customer ? { ...customer, profile: customerProfile } : null,
      dealer: dealer ? { ...dealer, profile: dealerProfile } : null,
      vehicle: vehicle ? { ...vehicle, images: vehicleImagesList } : null,
    };
  }

  async getOrderStats() {
    const statusCounts = await this.orders.getClient()
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL`)
      .groupBy(orders.status);

    const [{ totalRevenue }] = await this.orders.getClient()
      .select({ totalRevenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)::int` })
      .from(orders)
      .where(sql`${orders.deletedAt} IS NULL`);

    const totalOrders = statusCounts.reduce((sum, row) => sum + row.count, 0);

    return {
      totalOrders,
      totalRevenue,
      byStatus: statusCounts,
    };
  }

  async addStatusHistory(orderId: string, status: string, note?: string, userId?: string) {
    const [created] = await this.orders.getClient()
      .insert(orderStatus)
      .values({
        orderId,
        status: status as typeof orderStatus.$inferInsert.status,
        note: note ?? null,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    return created;
  }

  async addTimelineEvent(orderId: string, event: string, userId?: string) {
    const [created] = await this.orders.getClient()
      .insert(orderTimeline)
      .values({
        orderId,
        event,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    return created;
  }

  async addNote(orderId: string, note: string, userId?: string) {
    const [created] = await this.orders.getClient()
      .insert(orderNotes)
      .values({
        orderId,
        note,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    return created;
  }

  async getNotes(orderId: string) {
    return this.orders.getClient()
      .select()
      .from(orderNotes)
      .where(and(eq(orderNotes.orderId, orderId), sql`${orderNotes.deletedAt} IS NULL`))
      .orderBy(desc(orderNotes.createdAt));
  }

  async addDocument(orderId: string, documentUrl: string, userId?: string) {
    const [created] = await this.orders.getClient()
      .insert(orderDocuments)
      .values({
        orderId,
        documentUrl,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    return created;
  }

  async deleteDocument(documentId: string) {
    const client = this.orders.getClient();
    const [deleted] = await client
      .update(orderDocuments)
      .set({ deletedAt: new Date() })
      .where(eq(orderDocuments.id, documentId))
      .returning();

    return deleted ?? null;
  }

  async getDocuments(orderId: string) {
    return this.orders.getClient()
      .select()
      .from(orderDocuments)
      .where(and(eq(orderDocuments.orderId, orderId), sql`${orderDocuments.deletedAt} IS NULL`));
  }

  async softDeleteOrder(orderId: string, deletedBy?: string) {
    const [updated] = await this.orders.getClient()
      .update(orders)
      .set({
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated ?? null;
  }

  async restoreOrder(orderId: string) {
    const [updated] = await this.orders.getClient()
      .update(orders)
      .set({
        deletedAt: null,
        deletedBy: null,
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated ?? null;
  }

  async bulkDeleteOrders(ids: string[]) {
    if (ids.length === 0) return [];

    const results = await this.orders.getClient()
      .update(orders)
      .set({ deletedAt: new Date() })
      .where(sql`${orders.id} = ANY(${ids})`)
      .returning();

    return results;
  }

  async assignDealer(orderId: string, dealerId: string, userId?: string) {
    const client = this.orders.getClient();

    const [updatedOrder] = await client
      .update(orders)
      .set({
        dealerId,
        ...(userId ? { updatedBy: userId } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) return null;

    const [assignment] = await client
      .insert(dealerAssignments)
      .values({
        dealerId,
        orderId,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
      })
      .returning();

    await this.addTimelineEvent(orderId, `Dealer assigned: ${dealerId}`, userId);

    return { order: updatedOrder, assignment };
  }
}
