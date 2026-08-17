import { containers, ports, shipments, shipmentTracking, shippingDocuments, orders, customers, customerProfiles, dealers, dealerProfiles, vehicles } from '@/server/db/schema';
import { type InferModel, eq, and, or, like, sql, desc, asc, inArray, type SQL, type SQLWrapper } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import { db } from '@/server/db/client';
import type { PaginatedResult, PaginationOptions, SortOptions } from './baseRepository';

export class ShippingRepository {
  public readonly shipments = new BaseRepository(shipments);
  public readonly tracking = new BaseRepository(shipmentTracking);
  public readonly containers = new BaseRepository(containers);
  public readonly ports = new BaseRepository(ports);
  public readonly documents = new BaseRepository(shippingDocuments);

  async findByOrderId(orderId: string) {
    return this.shipments.getClient()
      .select()
      .from(shipments)
      .where(eq(shipments.orderId, orderId));
  }

  async createShipment(data: InferModel<typeof shipments, 'insert'>) {
    return this.shipments.create(data);
  }

  async getShipmentForEdit(shipmentId: string) {
    const [shipment] = await this.shipments.getClient()
      .select({
        id: shipments.id,
        orderId: shipments.orderId,
        carrier: shipments.carrier,
        status: shipments.status,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    return shipment ?? null;
  }



  async listShipments(options: {
    page?: number;
    limit?: number;
    status?: string;
    orderId?: string;
    carrier?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResult<Record<string, unknown>>> {
    const { page = 1, limit = 20, status, orderId, carrier, search, dateFrom, dateTo, sortColumn, sortDirection } = options;

    const conditions: SQL[] = [];

    // Always exclude soft-deleted records
    conditions.push(sql`${shipments.deletedAt} IS NULL`);

    // Filter by status
    if (status) {
      conditions.push(eq(shipments.status, status as 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled'));
    }

    // Filter by orderId
    if (orderId) {
      conditions.push(eq(shipments.orderId, orderId));
    }

    // Filter by carrier
    if (carrier) {
      conditions.push(like(shipments.carrier, `%${carrier}%`));
    }

    // Filter by search (carrier)
    if (search) {
      conditions.push(like(shipments.carrier, `%${search}%`));
    }

    // Filter by date range
    if (dateFrom) {
      conditions.push(sql`${shipments.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${shipments.createdAt} <= ${dateTo}`);
    }

    const whereClause = and(...conditions);

    // Count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(shipments)
      .where(whereClause);

    // Build query with relations
    const query = db
      .select({
        // Shipment fields
        id: shipments.id,
        orderId: shipments.orderId,
        status: shipments.status,
        carrier: shipments.carrier,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        createdBy: shipments.createdBy,
        updatedBy: shipments.updatedBy,
        // Order fields
        orderNumber: orders.orderNumber,
        orderStatus: orders.status,
        // Customer fields
        customerId: orders.customerId,
        // Dealer fields
        dealerId: orders.dealerId,
        // Vehicle fields
        vehicleId: orders.vehicleId,
        // Aggregate fields
        containerCount: sql<number>`(SELECT COUNT(*)::int FROM ${containers} WHERE ${containers.shipmentId} = ${shipments.id} AND ${containers.deletedAt} IS NULL)`,
        trackingCount: sql<number>`(SELECT COUNT(*)::int FROM ${shipmentTracking} WHERE ${shipmentTracking.shipmentId} = ${shipments.id} AND ${shipmentTracking.deletedAt} IS NULL)`,
      })
      .from(shipments)
      .leftJoin(orders, eq(shipments.orderId, orders.id))
      .where(whereClause);

    // Sort
    let sortedQuery;
    const sortCol = sortColumn ? (shipments as unknown as Record<string, SQLWrapper>)[sortColumn] : undefined;
    if (sortCol) {
      const sortFn = sortDirection === 'asc' ? asc : desc;
      sortedQuery = query.orderBy(sortFn(sortCol));
    } else {
      sortedQuery = query.orderBy(desc(shipments.createdAt));
    }

    // Paginate
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

  async getShipmentWithRelations(shipmentId: string) {
    const shipmentResult = await db
      .select({
        // Shipment fields
        id: shipments.id,
        orderId: shipments.orderId,
        status: shipments.status,
        carrier: shipments.carrier,
        createdAt: shipments.createdAt,
        updatedAt: shipments.updatedAt,
        createdBy: shipments.createdBy,
        updatedBy: shipments.updatedBy,
        deletedAt: shipments.deletedAt,
        deletedBy: shipments.deletedBy,
      })
      .from(shipments)
      .where(eq(shipments.id, shipmentId))
      .limit(1);

    const shipment = shipmentResult[0] as unknown as typeof shipments.$inferSelect | null;
    if (!shipment) {
      return null;
    }

    // Get tracking, containers, documents, and order in parallel
    const [tracking, containerList, documentList, orderResult] = await Promise.all([
      db.select()
        .from(shipmentTracking)
        .where(eq(shipmentTracking.shipmentId, shipmentId))
        .orderBy(desc(shipmentTracking.createdAt)),
      db.select()
        .from(containers)
        .where(eq(containers.shipmentId, shipmentId)),
      db.select()
        .from(shippingDocuments)
        .where(eq(shippingDocuments.shipmentId, shipmentId)),
      db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        dealerId: orders.dealerId,
        vehicleId: orders.vehicleId,
        status: orders.status,
        totalAmount: orders.totalAmount,
      })
        .from(orders)
        .where(eq(orders.id, shipment.orderId))
        .limit(1),
    ]);

    const order = orderResult[0] ?? null;

    // Get customer, dealer, and vehicle in parallel
    const [customerResult, dealerResult, vehicleResult] = await Promise.all([
      order?.customerId
        ? db.select({ id: customers.id, userId: customers.userId })
            .from(customers)
            .where(eq(customers.id, order.customerId))
            .limit(1)
            .then(async (rows) => {
              if (!rows[0]) return null;
              const profileResult = await db.select({ displayName: customerProfiles.displayName })
                .from(customerProfiles)
                .where(eq(customerProfiles.customerId, rows[0].id))
                .limit(1);
              return { id: rows[0].id, displayName: profileResult[0]?.displayName };
            })
        : Promise.resolve(null),
      order?.dealerId
        ? db.select({ id: dealers.id, userId: dealers.userId })
            .from(dealers)
            .where(eq(dealers.id, order.dealerId))
            .limit(1)
            .then(async (rows) => {
              if (!rows[0]) return null;
              const profileResult = await db.select({ displayName: dealerProfiles.displayName })
                .from(dealerProfiles)
                .where(eq(dealerProfiles.dealerId, rows[0].id))
                .limit(1);
              return { id: rows[0].id, displayName: profileResult[0]?.displayName };
            })
        : Promise.resolve(null),
      order?.vehicleId
        ? db.select({
            id: vehicles.id,
            year: vehicles.year,
            vin: vehicles.vin,
            stockNumber: vehicles.stockNumber,
            manufacturerId: vehicles.manufacturerId,
            modelId: vehicles.modelId,
          })
            .from(vehicles)
            .where(eq(vehicles.id, order.vehicleId))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
    ]);

    const customer = customerResult;
    const dealer = dealerResult;
    const vehicle = vehicleResult;

    return {
      ...shipment,
      tracking,
      containers: containerList,
      documents: documentList,
      order,
      customer,
      dealer,
      vehicle,
    };
  }

  async getShipmentStats() {
    const [statusCounts, upcomingEtas] = await Promise.all([
      db.select({
          status: shipments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(shipments)
        .where(sql`${shipments.deletedAt} IS NULL`)
        .groupBy(shipments.status),
      db.select({
          id: shipments.id,
          carrier: shipments.carrier,
          status: shipments.status,
          createdAt: shipments.createdAt,
        })
        .from(shipments)
        .where(
          and(
            sql`${shipments.deletedAt} IS NULL`,
            sql`${shipments.status} IN ('pending', 'in_transit')`
          )
        )
        .orderBy(asc(shipments.createdAt))
        .limit(10),
    ]);

    const totalShipments = statusCounts.reduce((sum, row) => sum + row.count, 0);
    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
    }

    return {
      totalShipments,
      pendingShipments: statusMap['pending'] ?? 0,
      inTransitShipments: statusMap['in_transit'] ?? 0,
      deliveredShipments: statusMap['delivered'] ?? 0,
      delayedShipments: statusMap['delayed'] ?? 0,
      cancelledShipments: statusMap['cancelled'] ?? 0,
      byStatus: statusCounts,
      upcomingEtas,
    };
  }

  async addTrackingEvent(shipmentId: string, location?: string | null, note?: string | null, userId?: string) {
    return this.tracking.create({
      shipmentId,
      location: location ?? null,
      note: note ?? null,
      createdBy: userId ?? null,
    } as InferModel<typeof shipmentTracking, 'insert'>);
  }

  async getTrackingEvents(shipmentId: string) {
    return db
      .select()
      .from(shipmentTracking)
      .where(eq(shipmentTracking.shipmentId, shipmentId))
      .orderBy(desc(shipmentTracking.createdAt));
  }

  async addDocument(shipmentId: string, documentUrl: string, userId?: string) {
    return this.documents.create({
      shipmentId,
      documentUrl,
      createdBy: userId ?? null,
    } as InferModel<typeof shippingDocuments, 'insert'>);
  }

  async deleteDocument(documentId: string) {
    return this.documents.softDelete(documentId);
  }

  async getDocuments(shipmentId: string) {
    return db
      .select()
      .from(shippingDocuments)
      .where(eq(shippingDocuments.shipmentId, shipmentId))
      .orderBy(desc(shippingDocuments.createdAt));
  }

  async addContainer(shipmentId: string, containerNumber: string, userId?: string) {
    return this.containers.create({
      shipmentId,
      containerNumber,
      createdBy: userId ?? null,
    } as InferModel<typeof containers, 'insert'>);
  }

  async deleteContainer(containerId: string) {
    return this.containers.softDelete(containerId);
  }

  async getContainers(shipmentId: string) {
    return db
      .select()
      .from(containers)
      .where(eq(containers.shipmentId, shipmentId))
      .orderBy(desc(containers.createdAt));
  }

  async softDeleteShipment(shipmentId: string, deletedBy?: string) {
    return this.shipments.softDelete(shipmentId, deletedBy);
  }

  async restoreShipment(shipmentId: string) {
    return this.shipments.update(shipmentId, {
      deletedAt: null,
      deletedBy: null,
    } as Partial<InferModel<typeof shipments, 'insert'>>);
  }

  async bulkDeleteShipments(ids: string[]) {
    if (ids.length === 0) return;

    await this.shipments.getClient()
      .update(shipments)
      .set({ deletedAt: new Date() })
      .where(inArray(shipments.id, ids));
  }

  async updateShipmentStatus(shipmentId: string, status: string) {
    return this.shipments.update(shipmentId, {
      status: status as 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled',
    } as Partial<InferModel<typeof shipments, 'insert'>>);
  }
}
