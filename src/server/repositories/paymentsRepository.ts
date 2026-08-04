import {
    currencies,
    exchangeRates,
    invoices,
    orderDocuments,
    paymentHistory,
    paymentMethods,
    paymentTransactions,
    payments,
    orders,
    customers,
    customerProfiles,
    dealers,
    dealerProfiles,
    vehicles,
} from '@/server/db/schema';
import { type InferModel, eq, and, or, like, sql, desc, asc, type SQL } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';
import type { PaginatedResult, PaginationOptions, SortOptions } from './baseRepository';

export class PaymentsRepository {
  public readonly payments = new BaseRepository(payments);
  public readonly history = new BaseRepository(paymentHistory);
  public readonly methods = new BaseRepository(paymentMethods);
  public readonly currencies = new BaseRepository(currencies);
  public readonly exchangeRates = new BaseRepository(exchangeRates);
  public readonly invoices = new BaseRepository(invoices);
  public readonly transactions = new BaseRepository(paymentTransactions);

  async findByOrderId(orderId: string) {
    return this.payments.getClient()
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId));
  }

  async findByUserId(userId: string) {
    return this.payments.getClient()
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));
  }

  async createPayment(data: InferModel<typeof payments, 'insert'>) {
    return this.payments.create(data);
  }

  async recordHistory(data: InferModel<typeof paymentHistory, 'insert'>) {
    return this.history.create(data);
  }

  async createInvoice(data: InferModel<typeof invoices, 'insert'>) {
    return this.invoices.create(data);
  }

  async updatePaymentStatus(paymentId: string, status: InferModel<typeof payments, 'insert'>['status']) {
    const [payment] = await this.payments.getClient()
      .update(payments)
      .set({ status })
      .where(eq(payments.id, paymentId))
      .returning();

    return payment ?? null;
  }

  // --- New methods ---

  async listPayments(options: {
    pagination?: PaginationOptions;
    sort?: SortOptions;
    status?: string;
    orderId?: string;
    currency?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<PaginatedResult<typeof payments.$inferSelect & {
    orderNumber: string | null;
    customerName: string | null;
    dealerName: string | null;
    vehicleTitle: string | null;
    vehicleVin: string | null;
  }>> {
    const { pagination, sort, status, orderId, currency, search, dateFrom, dateTo } = options;
    const { page = 1, limit = 20 } = pagination ?? {};
    const { column: sortCol, direction = 'desc' } = sort ?? {};

    const conditions: SQL[] = [sql`${payments.deletedAt} IS NULL`];

    if (status) {
      conditions.push(eq(payments.status, status as typeof payments.$inferSelect.status));
    }
    if (orderId) {
      conditions.push(eq(payments.orderId, orderId));
    }
    if (currency) {
      conditions.push(eq(payments.currency, currency));
    }
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(vehicles.vin, `%${search}%`),
          like(customerProfiles.displayName, `%${search}%`),
          like(dealerProfiles.displayName, `%${search}%`),
        )!,
      );
    }
    if (dateFrom) {
      conditions.push(sql`${payments.createdAt} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${payments.createdAt} <= ${dateTo}`);
    }

    const whereClause = and(...conditions);

    const countQuery = this.payments.getClient()
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(whereClause);

    if (search) {
      countQuery
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(customerProfiles, eq(customerProfiles.customerId, customers.id))
        .leftJoin(dealers, eq(orders.dealerId, dealers.id))
        .leftJoin(dealerProfiles, eq(dealerProfiles.dealerId, dealers.id))
        .leftJoin(vehicles, eq(orders.vehicleId, vehicles.id));
    }

    const [{ count }] = await countQuery;

    const sortFn = direction === 'asc' ? asc : desc;
    const sortColumn = sortCol && (payments as unknown as Record<string, unknown>)[sortCol]
      ? (payments as unknown as Record<string, unknown>)[sortCol]
      : payments.createdAt;

    const paymentRows = await this.payments.getClient()
      .select()
      .from(payments)
      .where(whereClause)
      .orderBy(sortFn(sortColumn as Parameters<typeof sortFn>[0]))
      .limit(limit)
      .offset((page - 1) * limit);

    const orderIds = paymentRows.map((p) => p.orderId).filter((id): id is string => !!id);

    const [orderRows, customerProfilesRows, dealerProfilesRows, vehicleRows] = await Promise.all([
      orderIds.length > 0
        ? this.payments.getClient()
            .select({
              id: orders.id,
              orderNumber: orders.orderNumber,
              customerId: orders.customerId,
              dealerId: orders.dealerId,
              vehicleId: orders.vehicleId,
            })
            .from(orders)
            .where(sql`${orders.id} = ANY(${orderIds})`)
        : Promise.resolve([] as { id: string; orderNumber: string; customerId: string | null; dealerId: string | null; vehicleId: string | null }[]),
      orderIds.length > 0
        ? this.payments.getClient()
            .select({ customerId: customerProfiles.customerId, displayName: customerProfiles.displayName })
            .from(customerProfiles)
            .innerJoin(customers, eq(customerProfiles.customerId, customers.id))
            .where(and(
              sql`${customers.id} IN (SELECT customer_id FROM orders WHERE id = ANY(${orderIds}))`,
              sql`${customerProfiles.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { customerId: string; displayName: string | null }[]),
      orderIds.length > 0
        ? this.payments.getClient()
            .select({ dealerId: dealerProfiles.dealerId, displayName: dealerProfiles.displayName })
            .from(dealerProfiles)
            .innerJoin(dealers, eq(dealerProfiles.dealerId, dealers.id))
            .where(and(
              sql`${dealers.id} IN (SELECT dealer_id FROM orders WHERE id = ANY(${orderIds}))`,
              sql`${dealerProfiles.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { dealerId: string; displayName: string | null }[]),
      orderIds.length > 0
        ? this.payments.getClient()
            .select({
              id: vehicles.id,
              vin: vehicles.vin,
              manufacturerId: vehicles.manufacturerId,
              modelId: vehicles.modelId,
              year: vehicles.year,
            })
            .from(vehicles)
            .where(sql`${vehicles.id} IN (SELECT vehicle_id FROM orders WHERE id = ANY(${orderIds}) AND vehicle_id IS NOT NULL)`)
        : Promise.resolve([] as { id: string; vin: string | null; manufacturerId: string | null; modelId: string | null; year: number | null }[]),
    ]);

    const orderMap = new Map(orderRows.map((o) => [o.id, o]));
    const customerMap = new Map(customerProfilesRows.map((cp) => [cp.customerId, cp.displayName]));
    const dealerMap = new Map(dealerProfilesRows.map((dp) => [dp.dealerId, dp.displayName]));
    const vehicleMap = new Map(vehicleRows.map((v) => [v.id, v]));

    const enrichedData = paymentRows.map((payment) => {
      const order = payment.orderId ? orderMap.get(payment.orderId) : undefined;
      const vehicle = order?.vehicleId ? vehicleMap.get(order.vehicleId) : undefined;
      let vehicleTitle: string | null = null;
      if (vehicle) {
        const parts: string[] = [];
        if (vehicle.year) parts.push(String(vehicle.year));
        if (vehicle.manufacturerId) parts.push(vehicle.manufacturerId);
        if (vehicle.modelId) parts.push(vehicle.modelId);
        vehicleTitle = parts.length > 0 ? parts.join(' ') : null;
      }

      return {
        ...payment,
        orderNumber: order?.orderNumber ?? null,
        customerName: order?.customerId ? customerMap.get(order.customerId) ?? null : null,
        dealerName: order?.dealerId ? dealerMap.get(order.dealerId) ?? null : null,
        vehicleTitle,
        vehicleVin: vehicle?.vin ?? null,
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

  async getPaymentWithRelations(paymentId: string) {
    const rawPayment = await this.payments.findById(paymentId);
    if (!rawPayment) return null;
    const payment = rawPayment as unknown as typeof payments.$inferSelect;

    const [historyRows, order] = await Promise.all([
      this.payments.getClient()
        .select()
        .from(paymentHistory)
        .where(and(eq(paymentHistory.paymentId, paymentId), sql`${paymentHistory.deletedAt} IS NULL`))
        .orderBy(desc(paymentHistory.createdAt)),
      payment.orderId
        ? this.payments.getClient()
            .select()
            .from(orders)
            .where(and(eq(orders.id, payment.orderId), sql`${orders.deletedAt} IS NULL`))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
    ]);

    let customer = null;
    let customerProfile = null;
    let dealer = null;
    let dealerProfile = null;
    let vehicle = null;

    if (order) {
      const o = order as unknown as typeof orders.$inferSelect;

      // Fetch customer, dealer, and vehicle in parallel
      const [customerResult, dealerResult, vehicleResult] = await Promise.all([
        o.customerId
          ? this.payments.getClient()
              .select()
              .from(customers)
              .where(and(eq(customers.id, o.customerId), sql`${customers.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        o.dealerId
          ? this.payments.getClient()
              .select()
              .from(dealers)
              .where(and(eq(dealers.id, o.dealerId), sql`${dealers.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        o.vehicleId
          ? this.payments.getClient()
              .select()
              .from(vehicles)
              .where(and(eq(vehicles.id, o.vehicleId), sql`${vehicles.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ]);

      // Fetch profiles in parallel (each depends on its parent)
      const [customerProfileResult, dealerProfileResult] = await Promise.all([
        customerResult
          ? this.payments.getClient()
              .select()
              .from(customerProfiles)
              .where(and(eq(customerProfiles.customerId, (customerResult as unknown as typeof customers.$inferSelect).id), sql`${customerProfiles.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        dealerResult
          ? this.payments.getClient()
              .select()
              .from(dealerProfiles)
              .where(and(eq(dealerProfiles.dealerId, (dealerResult as unknown as typeof dealers.$inferSelect).id), sql`${dealerProfiles.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ]);

      customer = customerResult;
      customerProfile = customerProfileResult;
      dealer = dealerResult;
      dealerProfile = dealerProfileResult;
      vehicle = vehicleResult;
    }

    return {
      ...payment,
      history: historyRows,
      order: order ? {
        ...order,
        customer,
        customerProfile,
        dealer,
        dealerProfile,
        vehicle,
      } : null,
    };
  }

  async getPaymentStats() {
    const [stats] = await this.payments.getClient()
      .select({
        totalRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'paid' then ${payments.amount} else 0 end), 0)`,
        outstandingBalance: sql<number>`coalesce(sum(case when ${payments.status} = 'pending' then ${payments.amount} else 0 end), 0)`,
        paidOrders: sql<number>`count(distinct case when ${payments.status} = 'paid' then ${payments.orderId} else null end)`,
        unpaidOrders: sql<number>`(select count(distinct o.id) from ${orders} o where o.deleted_at is null and not exists (select 1 from ${payments} p where p.order_id = o.id and p.status = 'paid' and p.deleted_at is null))`,
        partialPayments: sql<number>`count(distinct case when ${payments.status} = 'pending' and ${payments.amount} < (select o.total_amount from ${orders} o where o.id = ${payments.orderId}) then ${payments.id} else null end)`,
        refunds: sql<number>`count(distinct case when ${payments.status} = 'refunded' then ${payments.id} else null end)`,
        monthlyRevenue: sql<number>`coalesce(sum(case when ${payments.status} = 'paid' and ${payments.createdAt} >= date_trunc('month', now()) then ${payments.amount} else 0 end), 0)`,
        upcomingDuePayments: sql<number>`count(distinct case when ${payments.status} = 'pending' then ${payments.id} else null end)`,
      })
      .from(payments)
      .where(sql`${payments.deletedAt} IS NULL`);

    return {
      totalRevenue: stats?.totalRevenue ?? 0,
      outstandingBalance: stats?.outstandingBalance ?? 0,
      paidOrders: stats?.paidOrders ?? 0,
      unpaidOrders: stats?.unpaidOrders ?? 0,
      partialPayments: stats?.partialPayments ?? 0,
      refunds: stats?.refunds ?? 0,
      monthlyRevenue: stats?.monthlyRevenue ?? 0,
      upcomingDuePayments: stats?.upcomingDuePayments ?? 0,
    };
  }

  async updatePaymentStatusWithHistory(
    paymentId: string,
    status: InferModel<typeof payments, 'insert'>['status'],
    userId?: string,
  ) {
    return this.payments.getClient().transaction(async (tx) => {
      const [payment] = await tx
        .update(payments)
        .set({
          status,
          ...(userId ? { updatedBy: userId } : {}),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
        .returning();

      if (payment) {
        await tx.insert(paymentHistory).values({
          paymentId,
          status,
          createdBy: userId,
          updatedBy: userId,
        });
      }

      return payment ?? null;
    });
  }

  async addPaymentHistory(
    paymentId: string,
    status: InferModel<typeof paymentHistory, 'insert'>['status'],
    note?: string,
    userId?: string,
  ) {
    return this.history.create({
      paymentId,
      status,
      note: note ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async getPaymentHistory(paymentId: string) {
    return this.payments.getClient()
      .select()
      .from(paymentHistory)
      .where(and(eq(paymentHistory.paymentId, paymentId), sql`${paymentHistory.deletedAt} IS NULL`))
      .orderBy(desc(paymentHistory.createdAt));
  }

  async getInvoicesByOrderId(orderId: string) {
    return this.payments.getClient()
      .select()
      .from(invoices)
      .where(and(eq(invoices.orderId, orderId), sql`${invoices.deletedAt} IS NULL`))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceWithRelations(invoiceId: string) {
    const rawInvoice = await this.invoices.findById(invoiceId);
    if (!rawInvoice) return null;
    const invoice = rawInvoice as unknown as typeof invoices.$inferSelect;

    const [order, paymentsList] = await Promise.all([
      invoice.orderId
        ? this.payments.getClient()
            .select()
            .from(orders)
            .where(and(eq(orders.id, invoice.orderId), sql`${orders.deletedAt} IS NULL`))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      invoice.orderId
        ? this.payments.getClient()
            .select()
            .from(payments)
            .where(and(eq(payments.orderId, invoice.orderId), sql`${payments.deletedAt} IS NULL`))
            .orderBy(desc(payments.createdAt))
        : Promise.resolve([] as typeof payments.$inferSelect[]),
    ]);

    let customer = null;
    let customerProfile = null;
    if (order) {
      const o = order as unknown as typeof orders.$inferSelect;
      if (o.customerId) {
        customer = await this.payments.getClient()
          .select()
          .from(customers)
          .where(and(eq(customers.id, o.customerId), sql`${customers.deletedAt} IS NULL`))
          .limit(1)
          .then((rows) => rows[0] ?? null);

        if (customer) {
          customerProfile = await this.payments.getClient()
            .select()
            .from(customerProfiles)
            .where(and(eq(customerProfiles.customerId, (customer as unknown as typeof customers.$inferSelect).id), sql`${customerProfiles.deletedAt} IS NULL`))
            .limit(1)
            .then((rows) => rows[0] ?? null);
        }
      }
    }

    return {
      ...invoice,
      order: order ? { ...order, customer, customerProfile } : null,
      payments: paymentsList,
    };
  }

  async updateInvoice(invoiceId: string, data: Partial<InferModel<typeof invoices, 'insert'>>) {
    const [invoice] = await this.payments.getClient()
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return invoice ?? null;
  }

  async softDeletePayment(paymentId: string, deletedBy?: string) {
    const [payment] = await this.payments.getClient()
      .update(payments)
      .set({
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return payment ?? null;
  }

  async restorePayment(paymentId: string) {
    const [payment] = await this.payments.getClient()
      .update(payments)
      .set({
        deletedAt: null,
        deletedBy: null,
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return payment ?? null;
  }

  async bulkDeletePayments(ids: string[]) {
    if (ids.length === 0) return [];

    const results = await this.payments.getClient()
      .update(payments)
      .set({ deletedAt: new Date() })
      .where(sql`${payments.id} = ANY(${ids})`)
      .returning();

    return results;
  }

  async getCustomerFinance(customerId: string) {
    const customerOrders = await this.payments.getClient()
      .select({ id: orders.id })
      .from(orders)
      .where(and(eq(orders.customerId, customerId), sql`${orders.deletedAt} IS NULL`));

    const orderIds = customerOrders.map((o) => o.id);
    if (orderIds.length === 0) {
      return {
        outstandingInvoices: [] as typeof invoices.$inferSelect[],
        paymentHistory: [] as typeof payments.$inferSelect[],
        creditBalance: 0,
        refundHistory: [] as typeof payments.$inferSelect[],
      };
    }

    const [outstandingInvoices, paymentHistoryList, refundHistory] = await Promise.all([
      this.payments.getClient()
        .select()
        .from(invoices)
        .where(and(
          sql`${invoices.orderId} = ANY(${orderIds})`,
          sql`${invoices.deletedAt} IS NULL`,
        ))
        .orderBy(desc(invoices.createdAt)),
      this.payments.getClient()
        .select()
        .from(payments)
        .where(and(
          sql`${payments.orderId} = ANY(${orderIds})`,
          sql`${payments.deletedAt} IS NULL`,
        ))
        .orderBy(desc(payments.createdAt)),
      this.payments.getClient()
        .select()
        .from(payments)
        .where(and(
          sql`${payments.orderId} = ANY(${orderIds})`,
          eq(payments.status, 'refunded'),
          sql`${payments.deletedAt} IS NULL`,
        ))
        .orderBy(desc(payments.createdAt)),
    ]);

    const creditBalance = refundHistory.reduce((sum, p) => sum + ((p as unknown as typeof payments.$inferSelect).amount ?? 0), 0);

    return {
      outstandingInvoices,
      paymentHistory: paymentHistoryList,
      creditBalance,
      refundHistory,
    };
  }

  async getOrderFinance(orderId: string) {
    const rawOrder = await this.payments.getClient()
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), sql`${orders.deletedAt} IS NULL`))
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!rawOrder) return null;
    const order = rawOrder as unknown as typeof orders.$inferSelect;

    const [paymentsList, invoicesList] = await Promise.all([
      this.payments.getClient()
        .select()
        .from(payments)
        .where(and(eq(payments.orderId, orderId), sql`${payments.deletedAt} IS NULL`))
        .orderBy(desc(payments.createdAt)),
      this.payments.getClient()
        .select()
        .from(invoices)
        .where(and(eq(invoices.orderId, orderId), sql`${invoices.deletedAt} IS NULL`))
        .orderBy(desc(invoices.createdAt)),
    ]);

    const typedPayments = paymentsList as (typeof payments.$inferSelect)[];
    const paidAmount = typedPayments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + (p.amount ?? 0), 0);

    return {
      orderTotal: order.totalAmount,
      paidAmount,
      outstandingAmount: order.totalAmount - paidAmount,
      invoices: invoicesList,
      payments: typedPayments,
    };
  }

  // --- Invoice methods ---

  async getInvoiceById(invoiceId: string) {
    return this.invoices.findById(invoiceId);
  }

  async getInvoiceByNumber(invoiceNumber: string) {
    return this.payments.getClient()
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  async generateInvoiceNumber(): Promise<string> {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const [{ maxNumber }] = await this.payments.getClient()
      .select({ maxNumber: sql<number>`coalesce(max(cast(substring(invoice_number from 5) as integer)), 0)` })
      .from(invoices)
      .where(sql`invoice_number like '${prefix}-${year}-%'`);
    return `${prefix}-${year}-${String(maxNumber + 1).padStart(4, '0')}`;
  }

  async createInvoiceWithNumber(data: InferModel<typeof invoices, 'insert'>) {
    return this.payments.getClient().transaction(async (tx) => {
      const invoiceNumber = data.invoiceNumber ?? (() => {
        const prefix = 'INV';
        const year = new Date().getFullYear();
        return tx.select({ maxNumber: sql<number>`coalesce(max(cast(substring(invoice_number from 5) as integer)), 0)` })
          .from(invoices)
          .where(sql`invoice_number like '${prefix}-${year}-%'`)
          .then((rows) => `${prefix}-${year}-${String((rows[0]?.maxNumber ?? 0) + 1).padStart(4, '0')}`);
      })();

      const num = await invoiceNumber;
      return tx.insert(invoices).values({ ...data, invoiceNumber: num }).returning().then((rows) => rows[0]);
    });
  }

  async softDeleteInvoice(invoiceId: string, deletedBy?: string) {
    const [invoice] = await this.payments.getClient()
      .update(invoices)
      .set({
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return invoice ?? null;
  }

  async restoreInvoice(invoiceId: string) {
    const [invoice] = await this.payments.getClient()
      .update(invoices)
      .set({
        deletedAt: null,
        deletedBy: null,
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    return invoice ?? null;
  }

  async bulkDeleteInvoices(ids: string[]) {
    if (ids.length === 0) return [];
    return this.payments.getClient()
      .update(invoices)
      .set({ deletedAt: new Date() })
      .where(sql`${invoices.id} = ANY(${ids})`)
      .returning();
  }

  async listInvoices(options: {
    pagination?: PaginationOptions;
    sort?: SortOptions;
    status?: string;
    orderId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<PaginatedResult<typeof invoices.$inferSelect & {
    orderNumber: string | null;
    customerName: string | null;
  }>> {
    const { pagination, sort, status, orderId, search, dateFrom, dateTo } = options;
    const { page = 1, limit = 20 } = pagination ?? {};
    const { column: sortCol, direction = 'desc' } = sort ?? {};

    const conditions: SQL[] = [sql`${invoices.deletedAt} IS NULL`];

    if (status) {
      conditions.push(eq(invoices.status, status as typeof invoices.$inferSelect.status));
    }
    if (orderId) {
      conditions.push(eq(invoices.orderId, orderId));
    }
    if (search) {
      conditions.push(
        or(
          like(invoices.invoiceNumber, `%${search}%`),
          like(orders.orderNumber, `%${search}%`),
          like(customerProfiles.displayName, `%${search}%`),
        )!,
      );
    }
    if (dateFrom) {
      conditions.push(sql`${invoices.invoiceDate} >= ${dateFrom}`);
    }
    if (dateTo) {
      conditions.push(sql`${invoices.invoiceDate} <= ${dateTo}`);
    }

    const whereClause = and(...conditions);

    const [{ count }] = await this.payments.getClient()
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices)
      .innerJoin(orders, eq(invoices.orderId, orders.id))
      .leftJoin(customers, eq(orders.customerId, customers.id))
      .leftJoin(customerProfiles, eq(customerProfiles.customerId, customers.id))
      .where(whereClause);

    const sortFn = direction === 'asc' ? asc : desc;
    const sortColumn = sortCol && (invoices as unknown as Record<string, unknown>)[sortCol]
      ? (invoices as unknown as Record<string, unknown>)[sortCol]
      : invoices.createdAt;

    const invoiceRows = await this.payments.getClient()
      .select()
      .from(invoices)
      .where(whereClause)
      .orderBy(sortFn(sortColumn as Parameters<typeof sortFn>[0]))
      .limit(limit)
      .offset((page - 1) * limit);

    const orderIds = invoiceRows.map((i) => i.orderId).filter((id): id is string => !!id);

    const [orderRows, customerProfileRows] = await Promise.all([
      orderIds.length > 0
        ? this.payments.getClient()
            .select({ id: orders.id, orderNumber: orders.orderNumber, customerId: orders.customerId })
            .from(orders)
            .where(sql`${orders.id} = ANY(${orderIds})`)
        : Promise.resolve([] as { id: string; orderNumber: string; customerId: string | null }[]),
      orderIds.length > 0
        ? this.payments.getClient()
            .select({ customerId: customerProfiles.customerId, displayName: customerProfiles.displayName })
            .from(customerProfiles)
            .innerJoin(customers, eq(customerProfiles.customerId, customers.id))
            .where(and(
              sql`${customers.id} IN (SELECT customer_id FROM orders WHERE id = ANY(${orderIds}))`,
              sql`${customerProfiles.deletedAt} IS NULL`,
            ))
        : Promise.resolve([] as { customerId: string; displayName: string | null }[]),
    ]);

    const orderMap = new Map(orderRows.map((o) => [o.id, o]));
    const customerMap = new Map(customerProfileRows.map((cp) => [cp.customerId, cp.displayName]));

    const enrichedData = invoiceRows.map((invoice) => {
      const order = orderMap.get(invoice.orderId);
      return {
        ...invoice,
        orderNumber: order?.orderNumber ?? null,
        customerName: order?.customerId ? customerMap.get(order.customerId) ?? null : null,
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

  // --- Transaction methods ---

  async createTransaction(data: InferModel<typeof paymentTransactions, 'insert'>) {
    return this.transactions.create(data);
  }

  async getTransactionsByPaymentId(paymentId: string) {
    return this.payments.getClient()
      .select()
      .from(paymentTransactions)
      .where(and(eq(paymentTransactions.paymentId, paymentId), sql`${paymentTransactions.deletedAt} IS NULL`))
      .orderBy(desc(paymentTransactions.transactionDate));
  }

  async getTransactionsByOrderId(orderId: string) {
    return this.payments.getClient()
      .select()
      .from(paymentTransactions)
      .where(and(eq(paymentTransactions.orderId, orderId), sql`${paymentTransactions.deletedAt} IS NULL`))
      .orderBy(desc(paymentTransactions.transactionDate));
  }

  async getTransactionById(transactionId: string) {
    return this.transactions.findById(transactionId);
  }

  async updateTransaction(transactionId: string, data: Partial<InferModel<typeof paymentTransactions, 'insert'>>) {
    const [transaction] = await this.payments.getClient()
      .update(paymentTransactions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, transactionId))
      .returning();
    return transaction ?? null;
  }

  async softDeleteTransaction(transactionId: string, deletedBy?: string) {
    const [transaction] = await this.payments.getClient()
      .update(paymentTransactions)
      .set({
        deletedAt: new Date(),
        ...(deletedBy ? { deletedBy } : {}),
      })
      .where(eq(paymentTransactions.id, transactionId))
      .returning();
    return transaction ?? null;
  }

  async restoreTransaction(transactionId: string) {
    const [transaction] = await this.payments.getClient()
      .update(paymentTransactions)
      .set({
        deletedAt: null,
        deletedBy: null,
      })
      .where(eq(paymentTransactions.id, transactionId))
      .returning();
    return transaction ?? null;
  }

  // --- Payment method methods ---

  async getPaymentMethodsByUserId(userId: string) {
    return this.payments.getClient()
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.userId, userId), sql`${paymentMethods.deletedAt} IS NULL`))
      .orderBy(desc(paymentMethods.createdAt));
  }

  async createPaymentMethod(data: InferModel<typeof paymentMethods, 'insert'>) {
    return this.methods.create(data);
  }

  async getDefaultPaymentMethod(userId: string) {
    return this.payments.getClient()
      .select()
      .from(paymentMethods)
      .where(and(
        eq(paymentMethods.userId, userId),
        eq(paymentMethods.isDefault, 1),
        sql`${paymentMethods.deletedAt} IS NULL`,
      ))
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  // --- Payment detail with transactions ---

  async getPaymentWithTransactions(paymentId: string) {
    const rawPayment = await this.payments.findById(paymentId);
    if (!rawPayment) return null;
    const payment = rawPayment as unknown as typeof payments.$inferSelect;

    const [historyRows, transactionRows, order, documents] = await Promise.all([
      this.payments.getClient()
        .select()
        .from(paymentHistory)
        .where(and(eq(paymentHistory.paymentId, paymentId), sql`${paymentHistory.deletedAt} IS NULL`))
        .orderBy(desc(paymentHistory.createdAt)),
      this.payments.getClient()
        .select()
        .from(paymentTransactions)
        .where(and(eq(paymentTransactions.paymentId, paymentId), sql`${paymentTransactions.deletedAt} IS NULL`))
        .orderBy(desc(paymentTransactions.transactionDate)),
      payment.orderId
        ? this.payments.getClient()
            .select()
            .from(orders)
            .where(and(eq(orders.id, payment.orderId), sql`${orders.deletedAt} IS NULL`))
            .limit(1)
            .then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
      payment.orderId
        ? this.payments.getClient()
            .select()
            .from(orderDocuments)
            .where(and(eq(orderDocuments.orderId, payment.orderId), sql`${orderDocuments.deletedAt} IS NULL`))
            .orderBy(desc(orderDocuments.createdAt))
        : Promise.resolve([] as typeof orderDocuments.$inferSelect[]),
    ]);

    let customer = null;
    let customerProfile = null;
    let dealer = null;
    let dealerProfile = null;
    let vehicle = null;

    if (order) {
      const o = order as unknown as typeof orders.$inferSelect;

      // Fetch customer, dealer, and vehicle in parallel
      const [customerResult, dealerResult, vehicleResult] = await Promise.all([
        o.customerId
          ? this.payments.getClient()
              .select()
              .from(customers)
              .where(and(eq(customers.id, o.customerId), sql`${customers.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        o.dealerId
          ? this.payments.getClient()
              .select()
              .from(dealers)
              .where(and(eq(dealers.id, o.dealerId), sql`${dealers.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        o.vehicleId
          ? this.payments.getClient()
              .select()
              .from(vehicles)
              .where(and(eq(vehicles.id, o.vehicleId), sql`${vehicles.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ]);

      // Fetch profiles in parallel (each depends on its parent)
      const [customerProfileResult, dealerProfileResult] = await Promise.all([
        customerResult
          ? this.payments.getClient()
              .select()
              .from(customerProfiles)
              .where(and(eq(customerProfiles.customerId, (customerResult as unknown as typeof customers.$inferSelect).id), sql`${customerProfiles.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        dealerResult
          ? this.payments.getClient()
              .select()
              .from(dealerProfiles)
              .where(and(eq(dealerProfiles.dealerId, (dealerResult as unknown as typeof dealers.$inferSelect).id), sql`${dealerProfiles.deletedAt} IS NULL`))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ]);

      customer = customerResult;
      customerProfile = customerProfileResult;
      dealer = dealerResult;
      dealerProfile = dealerProfileResult;
      vehicle = vehicleResult;
    }

    return {
      ...payment,
      history: historyRows,
      transactions: transactionRows,
      documents: documents as typeof orderDocuments.$inferSelect[],
      order: order ? {
        ...order,
        customer,
        customerProfile,
        dealer,
        dealerProfile,
        vehicle,
      } : null,
    };
  }
}
