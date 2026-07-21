import { orderItems, orders } from '@/server/db/schema';
import { type InferModel, eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

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
}
