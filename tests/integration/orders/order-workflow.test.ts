import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isValidStatusTransition, ORDER_STATUS_TRANSITIONS, type OrderStatus } from '@/lib/types/order';

const UUID = '550e8400-e29b-41d4-a716-446655440010';
const CUST_UUID = '550e8400-e29b-41d4-a716-446655440011';
const VEH_UUID = '550e8400-e29b-41d4-a716-446655440012';
const DEALER_UUID = '550e8400-e29b-41d4-a716-446655440013';

const mockOrderFindById = vi.fn();
const mockOrderFindByOrderNumber = vi.fn();
const mockOrderCreateOrder = vi.fn();
const mockOrderUpdateOrderStatus = vi.fn();
const mockOrderIsVehicleReserved = vi.fn();
const mockOrderFindByCustomer = vi.fn();
const mockOrderFindByDealer = vi.fn();

vi.mock('@/server/services/notificationService', () => ({
  notificationService: { dispatch: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('@/server/db/client', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
  },
}));

vi.mock('@/server/db/schema', () => ({
  orders: { id: 'id', customerId: 'customerId', orderNumber: 'orderNumber', status: 'status' },
  orderNotes: { id: 'id', orderId: 'orderId' },
  dealers: { id: 'id' },
}));

vi.mock('@/server/repositories/orderRepository', () => ({
  OrderRepository: vi.fn().mockImplementation(function () {
    return {
      orders: {
        findById: mockOrderFindById,
        getClient: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([]),
          limit: vi.fn().mockResolvedValue([]),
          then: vi.fn(),
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      findByOrderNumber: mockOrderFindByOrderNumber,
      createOrder: mockOrderCreateOrder,
      updateOrderStatus: mockOrderUpdateOrderStatus,
      isVehicleReserved: mockOrderIsVehicleReserved,
      findByCustomer: mockOrderFindByCustomer,
      findByDealer: mockOrderFindByDealer,
      addStatusHistory: vi.fn().mockResolvedValue({}),
      addTimelineEvent: vi.fn().mockResolvedValue({}),
      softDeleteOrder: vi.fn().mockResolvedValue({}),
      restoreOrder: vi.fn().mockResolvedValue({}),
      listOrders: vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } }),
      getOrderWithRelations: vi.fn().mockResolvedValue(null),
      getOrderForEdit: vi.fn().mockResolvedValue(null),
      addNote: vi.fn().mockResolvedValue({}),
      addDocument: vi.fn().mockResolvedValue({}),
      deleteDocument: vi.fn().mockResolvedValue(null),
      getDocuments: vi.fn().mockResolvedValue([]),
      getOrderStats: vi.fn().mockResolvedValue({ totalOrders: 0, totalRevenue: 0, byStatus: [] }),
    };
  }),
}));

function makeOrder(overrides: Record<string, any> = {}) {
  return {
    id: UUID,
    orderNumber: 'ORD-2024-001',
    customerId: CUST_UUID,
    dealerId: null,
    vehicleId: VEH_UUID,
    status: 'pending' as OrderStatus,
    totalAmount: 2500000,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Order - Status Transition Validation', () => {
  it('allows pending → confirmed', () => {
    expect(isValidStatusTransition('pending', 'confirmed')).toBe(true);
  });

  it('allows pending → cancelled', () => {
    expect(isValidStatusTransition('pending', 'cancelled')).toBe(true);
  });

  it('allows confirmed → processing', () => {
    expect(isValidStatusTransition('confirmed', 'processing')).toBe(true);
  });

  it('allows confirmed → cancelled', () => {
    expect(isValidStatusTransition('confirmed', 'cancelled')).toBe(true);
  });

  it('allows processing → shipped', () => {
    expect(isValidStatusTransition('processing', 'shipped')).toBe(true);
  });

  it('allows processing → cancelled', () => {
    expect(isValidStatusTransition('processing', 'cancelled')).toBe(true);
  });

  it('allows shipped → delivered', () => {
    expect(isValidStatusTransition('shipped', 'delivered')).toBe(true);
  });

  it('allows delivered → cancelled', () => {
    expect(isValidStatusTransition('delivered', 'cancelled')).toBe(true);
  });

  it('rejects pending → shipped', () => {
    expect(isValidStatusTransition('pending', 'shipped')).toBe(false);
  });

  it('rejects pending → delivered', () => {
    expect(isValidStatusTransition('pending', 'delivered')).toBe(false);
  });

  it('rejects delivered → pending', () => {
    expect(isValidStatusTransition('delivered', 'pending')).toBe(false);
  });

  it('rejects cancelled → any status', () => {
    expect(ORDER_STATUS_TRANSITIONS['cancelled']).toHaveLength(0);
  });

  it('rejects shipped → pending', () => {
    expect(isValidStatusTransition('shipped', 'pending')).toBe(false);
  });

  it('rejects processing → pending', () => {
    expect(isValidStatusTransition('processing', 'pending')).toBe(false);
  });
});

describe('Order - Order Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a new order', async () => {
    mockOrderFindByOrderNumber.mockResolvedValue(null);
    mockOrderIsVehicleReserved.mockResolvedValue(false);
    mockOrderCreateOrder.mockResolvedValue({ id: 'new-order-id', orderNumber: 'ORD-2024-999' });

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();
    const result = await service.createOrder({
      orderNumber: 'ORD-2024-999',
      customerId: CUST_UUID,
      vehicleId: VEH_UUID,
      status: 'pending',
      totalAmount: 3000000,
    });

    expect(result).toBeDefined();
    expect(mockOrderCreateOrder).toHaveBeenCalled();
  });

  it('rejects duplicate order numbers', async () => {
    mockOrderFindByOrderNumber.mockResolvedValue({ id: 'existing', orderNumber: 'ORD-2024-001' });

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(
      service.createOrder({
        orderNumber: 'ORD-2024-001',
        status: 'pending',
        totalAmount: 1000,
      })
    ).rejects.toThrow('already exists');
  });

  it('rejects order when vehicle is reserved', async () => {
    mockOrderFindByOrderNumber.mockResolvedValue(null);
    mockOrderIsVehicleReserved.mockResolvedValue(true);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(
      service.createOrder({
        orderNumber: 'ORD-2024-NEW',
        vehicleId: VEH_UUID,
        status: 'pending',
        totalAmount: 1000,
      })
    ).rejects.toThrow('already reserved');
  });

  it('validates full lifecycle: pending → confirmed → processing → shipped → delivered', async () => {
    const order = makeOrder({ status: 'pending' });
    mockOrderFindById.mockResolvedValue(order);
    mockOrderUpdateOrderStatus.mockResolvedValue({});

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await service.updateOrderStatus(order.id, 'confirmed');
    mockOrderFindById.mockResolvedValue({ ...order, status: 'confirmed' });

    await service.updateOrderStatus(order.id, 'processing');
    mockOrderFindById.mockResolvedValue({ ...order, status: 'processing' });

    await service.updateOrderStatus(order.id, 'shipped');
    mockOrderFindById.mockResolvedValue({ ...order, status: 'shipped' });

    await service.updateOrderStatus(order.id, 'delivered');

    expect(mockOrderUpdateOrderStatus).toHaveBeenCalledTimes(4);
  });

  it('rejects invalid transition: pending → shipped', async () => {
    const order = makeOrder({ status: 'pending' });
    mockOrderFindById.mockResolvedValue(order);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(service.updateOrderStatus(order.id, 'shipped')).rejects.toThrow('Invalid status transition');
  });

  it('rejects invalid transition: delivered → pending', async () => {
    const order = makeOrder({ status: 'delivered' });
    mockOrderFindById.mockResolvedValue(order);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(service.updateOrderStatus(order.id, 'pending')).rejects.toThrow('Invalid status transition');
  });

  it('cancelled orders cannot be shipped', async () => {
    const order = makeOrder({ status: 'cancelled' });
    mockOrderFindById.mockResolvedValue(order);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(service.updateOrderStatus(order.id, 'shipped')).rejects.toThrow('Invalid status transition');
  });

  it('throws OrderNotFoundError for nonexistent order', async () => {
    mockOrderFindById.mockResolvedValue(null);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(service.updateOrderStatus('550e8400-e29b-41d4-a716-446655440099', 'confirmed')).rejects.toThrow('Order not found');
  });
});

describe('Order - Ownership Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOrdersByCustomer returns only that customer orders', async () => {
    mockOrderFindByCustomer.mockResolvedValue([makeOrder({ customerId: CUST_UUID })]);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();
    const result = await service.getOrdersByCustomer(CUST_UUID);

    expect(result).toHaveLength(1);
    expect(mockOrderFindByCustomer).toHaveBeenCalledWith(CUST_UUID);
  });

  it('getOrdersByDealer returns only that dealer orders', async () => {
    mockOrderFindByDealer.mockResolvedValue([makeOrder({ dealerId: DEALER_UUID })]);

    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();
    const result = await service.getOrdersByDealer(DEALER_UUID);

    expect(result).toHaveLength(1);
    expect(mockOrderFindByDealer).toHaveBeenCalledWith(DEALER_UUID);
  });

  it('throws ValidationError for empty customerId', async () => {
    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(service.getOrdersByCustomer('')).rejects.toThrow('Customer ID is required');
  });

  it('throws ValidationError for empty dealerId', async () => {
    const { OrderService } = await import('@/server/services/orderService');
    const service = new OrderService();

    await expect(service.getOrdersByDealer('')).rejects.toThrow('Dealer ID is required');
  });
});
