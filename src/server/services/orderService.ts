import { OrderRepository } from '@/server/repositories';
import { orderNotes, dealers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isValidStatusTransition, type OrderStatus, type OrderListParams } from '@/lib/types/order';
import { DealerNotFoundError, DocumentNotFoundError, InvalidOrderStatusTransitionError, OrderNotFoundError, ValidationError } from './errors';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validation Schemas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CreateOrderSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerId: z.string().uuid('Invalid customer ID').optional().nullable(),
  dealerId: z.string().uuid('Invalid dealer ID').optional().nullable(),
  vehicleId: z.string().uuid('Invalid vehicle ID').optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending'),
  totalAmount: z.number().int().nonnegative().default(0),
});
export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

export const AddOrderItemSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  vehicleId: z.string().uuid('Invalid vehicle ID').optional().nullable(),
  quantity: z.number().int().positive().default(1),
  price: z.number().int().nonnegative().default(0),
});
export type AddOrderItemDTO = z.infer<typeof AddOrderItemSchema>;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Service Layer
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class OrderService {
  constructor(private readonly orderRepo: OrderRepository = new OrderRepository()) {}

  /**
   * Retrieves an order by its unique order number.
   */
  async getOrderByNumber(orderNumber: string) {
    if (!orderNumber) {
      throw new ValidationError('Order number is required');
    }

    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new OrderNotFoundError(orderNumber);
    }
    return order;
  }

  /**
   * Retrieves all orders for a specific customer.
   */
  async getOrdersByCustomer(customerId: string) {
    if (!customerId) {
      throw new ValidationError('Customer ID is required');
    }
    return this.orderRepo.findByCustomer(customerId);
  }

  /**
   * Retrieves all orders assigned to a specific dealer.
   */
  async getOrdersByDealer(dealerId: string) {
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }
    return this.orderRepo.findByDealer(dealerId);
  }

  /**
   * Creates a new order.
   */
  async createOrder(data: CreateOrderDTO) {
    const validatedData = CreateOrderSchema.parse(data);
    
    // Check if order number already exists
    const existingOrder = await this.orderRepo.findByOrderNumber(validatedData.orderNumber);
    if (existingOrder) {
      throw new ValidationError(`Order number already exists: ${validatedData.orderNumber}`);
    }

    return this.orderRepo.createOrder(validatedData as unknown as Parameters<typeof this.orderRepo.createOrder>[0]);
  }

  /**
   * Adds an item to an order.
   */
  async addOrderItem(data: AddOrderItemDTO) {
    const validatedData = AddOrderItemSchema.parse(data);
    return this.orderRepo.addOrderItem(validatedData as unknown as Parameters<typeof this.orderRepo.addOrderItem>[0]);
  }

  /**
   * Updates the status of an order.
   */
  async updateOrderStatus(orderId: string, newStatus: CreateOrderDTO['status']) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    if (!newStatus) {
      throw new ValidationError('New status is required');
    }

    // Usually we would fetch the order to check valid transitions
    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    // Simplistic transition logic - can be expanded
    if ((existingOrder as { status: string }).status === 'cancelled' && newStatus !== 'cancelled') {
      throw new InvalidOrderStatusTransitionError((existingOrder as { status: string }).status, newStatus);
    }

    const updated = await this.orderRepo.updateOrderStatus(orderId, newStatus as unknown as Parameters<typeof this.orderRepo.updateOrderStatus>[1]);
    if (!updated) {
      throw new OrderNotFoundError(orderId);
    }

    return updated;
  }

  /**
   * Retrieves a paginated list of orders with optional filters.
   */
  async listOrders(params: OrderListParams) {
    return this.orderRepo.listOrders({
      filters: {
        status: params.status,
        customerId: params.customerId,
        dealerId: params.dealerId,
        vehicleId: params.vehicleId,
        search: params.search,
        paymentStatus: params.paymentStatus,
        shippingStatus: params.shippingStatus,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
      pagination: {
        page: params.page,
        limit: params.limit,
      },
      sort: {
        column: params.sortColumn,
        direction: params.sortDirection,
      },
    });
  }

  /**
   * Returns a single order with all related entities.
   */
  async getOrderDetail(orderId: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    const order = await this.orderRepo.getOrderWithRelations(orderId);
    if (!order) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  /**
   * Changes the status of an order with transition validation.
   */
  async changeOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId?: string,
    note?: string,
  ) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    if (!newStatus) {
      throw new ValidationError('New status is required');
    }

    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    const currentStatus = (existingOrder as unknown as { status: string }).status as OrderStatus;

    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new InvalidOrderStatusTransitionError(currentStatus, newStatus);
    }

    const updated = await this.orderRepo.updateOrderStatus(orderId, newStatus as Parameters<typeof this.orderRepo.updateOrderStatus>[1]);
    if (!updated) {
      throw new OrderNotFoundError(orderId);
    }

    await this.orderRepo.addStatusHistory(orderId, newStatus, note, userId);

    await this.orderRepo.addTimelineEvent(
      orderId,
      `Status changed from ${currentStatus} to ${newStatus}`,
      userId,
    );

    return updated;
  }

  /**
   * Adds a note to an order.
   */
  async addNote(orderId: string, note: string, userId?: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    if (!note) {
      throw new ValidationError('Note content is required');
    }

    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    const createdNote = await this.orderRepo.addNote(orderId, note, userId);

    await this.orderRepo.addTimelineEvent(orderId, 'Note added', userId);

    return createdNote;
  }

  /**
   * Deletes a note by its ID.
   */
  async deleteNote(noteId: string) {
    if (!noteId) {
      throw new ValidationError('Note ID is required');
    }

    const deleted = await this.orderRepo.orders.getClient()
      .delete(orderNotes)
      .where(eq(orderNotes.id, noteId))
      .returning();

    return deleted;
  }

  /**
   * Adds a document to an order.
   */
  async addDocument(orderId: string, documentUrl: string, userId?: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    if (!documentUrl) {
      throw new ValidationError('Document URL is required');
    }

    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    const createdDoc = await this.orderRepo.addDocument(orderId, documentUrl, userId);

    await this.orderRepo.addTimelineEvent(orderId, 'Document added', userId);

    return createdDoc;
  }

  /**
   * Deletes a document by its ID.
   */
  async deleteDocument(documentId: string) {
    if (!documentId) {
      throw new ValidationError('Document ID is required');
    }

    const deleted = await this.orderRepo.deleteDocument(documentId);
    if (!deleted) {
      throw new DocumentNotFoundError(documentId);
    }

    return deleted;
  }

  /**
   * Retrieves all documents for an order.
   */
  async getDocuments(orderId: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    return this.orderRepo.getDocuments(orderId);
  }

  /**
   * Soft-deletes an order.
   */
  async softDeleteOrder(orderId: string, userId?: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    const deleted = await this.orderRepo.softDeleteOrder(orderId, userId);
    if (!deleted) {
      throw new OrderNotFoundError(orderId);
    }

    await this.orderRepo.addTimelineEvent(orderId, 'Order deleted', userId);

    return deleted;
  }

  /**
   * Restores a soft-deleted order.
   */
  async restoreOrder(orderId: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }

    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    const restored = await this.orderRepo.restoreOrder(orderId);
    if (!restored) {
      throw new OrderNotFoundError(orderId);
    }

    await this.orderRepo.addTimelineEvent(orderId, 'Order restored');

    return restored;
  }

  /**
   * Bulk-updates the status of multiple orders.
   */
  async bulkUpdateStatus(ids: string[], status: OrderStatus, userId?: string) {
    if (!ids.length) {
      throw new ValidationError('At least one order ID is required');
    }

    const results = await Promise.all(
      ids.map((id) => this.changeOrderStatus(id, status, userId)),
    );

    return results;
  }

  /**
   * Soft-deletes multiple orders.
   */
  async bulkDelete(ids: string[], userId?: string) {
    if (!ids.length) {
      throw new ValidationError('At least one order ID is required');
    }

    const results = await Promise.all(
      ids.map((id) => this.softDeleteOrder(id, userId)),
    );

    return results;
  }

  /**
   * Assigns a dealer to an order.
   */
  async assignDealer(orderId: string, dealerId: string, userId?: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    if (!dealerId) {
      throw new ValidationError('Dealer ID is required');
    }

    const existingOrder = await this.orderRepo.orders.findById(orderId);
    if (!existingOrder) {
      throw new OrderNotFoundError(orderId);
    }

    const existingDealer = await this.orderRepo.orders.getClient()
      .select()
      .from(dealers)
      .where(eq(dealers.id, dealerId))
      .limit(1);

    if (!existingDealer.length) {
      throw new DealerNotFoundError(dealerId);
    }

    return this.orderRepo.assignDealer(orderId, dealerId, userId);
  }

  /**
   * Returns aggregated order statistics.
   */
  async getOrderStats() {
    return this.orderRepo.getOrderStats();
  }
}
