import { OrderRepository } from '@/server/repositories';
import { z } from 'zod';
import { InvalidOrderStatusTransitionError, OrderNotFoundError, ValidationError } from './errors';

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
}
