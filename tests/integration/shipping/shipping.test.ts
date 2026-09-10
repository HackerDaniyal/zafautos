import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isValidShipmentTransition, SHIPMENT_STATUS_TRANSITIONS, type ShipmentStatus } from '@/lib/types/shipping';

const mockShipmentFindById = vi.fn();
const mockShipmentFindByOrderId = vi.fn();
const mockShipmentCreateShipment = vi.fn();
const mockShipmentUpdateStatus = vi.fn();
const mockShipmentAddTrackingEvent = vi.fn();
const mockShipmentGetShipmentWithRelations = vi.fn();
const mockShipmentSoftDelete = vi.fn();
const mockShipmentRestore = vi.fn();
const mockShipmentGetShipmentForEdit = vi.fn();

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

vi.mock('@/server/repositories', () => ({
  ShippingRepository: vi.fn().mockImplementation(function () {
    return {
      shipments: {
        findById: mockShipmentFindById,
        update: vi.fn().mockResolvedValue({}),
      },
      ports: { findMany: vi.fn().mockResolvedValue([]) },
      findByOrderId: mockShipmentFindByOrderId,
      createShipment: mockShipmentCreateShipment,
      updateShipmentStatus: mockShipmentUpdateStatus,
      addTrackingEvent: mockShipmentAddTrackingEvent,
      getShipmentWithRelations: mockShipmentGetShipmentWithRelations,
      softDeleteShipment: mockShipmentSoftDelete,
      restoreShipment: mockShipmentRestore,
      getShipmentForEdit: mockShipmentGetShipmentForEdit,
    };
  }),
}));

function makeShipment(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440030',
    orderId: '550e8400-e29b-41d4-a716-446655440010',
    carrier: 'Maersk',
    trackingNumber: 'MSKU0000001',
    vessel: 'Ocean Star',
    status: 'pending' as ShipmentStatus,
    shippingCost: 150000,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('Shipment - Status Transition Validation', () => {
  it('allows pending → booked', () => {
    expect(isValidShipmentTransition('pending', 'booked')).toBe(true);
  });

  it('allows pending → cancelled', () => {
    expect(isValidShipmentTransition('pending', 'cancelled')).toBe(true);
  });

  it('allows booked → picked_up', () => {
    expect(isValidShipmentTransition('booked', 'picked_up')).toBe(true);
  });

  it('allows picked_up → in_transit', () => {
    expect(isValidShipmentTransition('picked_up', 'in_transit')).toBe(true);
  });

  it('allows in_transit → arrived', () => {
    expect(isValidShipmentTransition('in_transit', 'arrived')).toBe(true);
  });

  it('allows arrived → delivered', () => {
    expect(isValidShipmentTransition('arrived', 'delivered')).toBe(true);
  });

  it('allows in_transit → delayed', () => {
    expect(isValidShipmentTransition('in_transit', 'delayed')).toBe(true);
  });

  it('allows in_transit → exception', () => {
    expect(isValidShipmentTransition('in_transit', 'exception')).toBe(true);
  });

  it('allows delayed → in_transit', () => {
    expect(isValidShipmentTransition('delayed', 'in_transit')).toBe(true);
  });

  it('allows exception → in_transit', () => {
    expect(isValidShipmentTransition('exception', 'in_transit')).toBe(true);
  });

  it('rejects delivered → any status', () => {
    expect(SHIPMENT_STATUS_TRANSITIONS['delivered']).toHaveLength(0);
  });

  it('rejects cancelled → any status', () => {
    expect(SHIPMENT_STATUS_TRANSITIONS['cancelled']).toHaveLength(0);
  });

  it('rejects pending → in_transit', () => {
    expect(isValidShipmentTransition('pending', 'in_transit')).toBe(false);
  });

  it('rejects booked → delivered', () => {
    expect(isValidShipmentTransition('booked', 'delivered')).toBe(false);
  });

  it('rejects picked_up → delivered', () => {
    expect(isValidShipmentTransition('picked_up', 'delivered')).toBe(false);
  });
});

describe('Shipment - Full Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('follows full lifecycle: pending → booked → picked_up → in_transit → arrived → delivered', async () => {
    const statuses: ShipmentStatus[] = ['booked', 'picked_up', 'in_transit', 'arrived', 'delivered'];
    const shipment = makeShipment({ status: 'pending' });

    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentUpdateStatus.mockResolvedValue({});
    mockShipmentAddTrackingEvent.mockResolvedValue({});

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    for (const status of statuses) {
      await service.changeShipmentStatus(shipment.id, status);
      mockShipmentFindById.mockResolvedValue({ ...shipment, status });
    }

    expect(mockShipmentUpdateStatus).toHaveBeenCalledTimes(5);
  });

  it('handles delayed status then resume to in_transit', async () => {
    const shipment = makeShipment({ status: 'in_transit' });
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentUpdateStatus.mockResolvedValue({});
    mockShipmentAddTrackingEvent.mockResolvedValue({});

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    await service.changeShipmentStatus(shipment.id, 'delayed');
    mockShipmentFindById.mockResolvedValue({ ...shipment, status: 'delayed' });
    await service.changeShipmentStatus(shipment.id, 'in_transit');

    expect(mockShipmentUpdateStatus).toHaveBeenCalledTimes(2);
  });

  it('handles exception status then resume to in_transit', async () => {
    const shipment = makeShipment({ status: 'arrived' });
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentUpdateStatus.mockResolvedValue({});
    mockShipmentAddTrackingEvent.mockResolvedValue({});

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    await service.changeShipmentStatus(shipment.id, 'exception');
    mockShipmentFindById.mockResolvedValue({ ...shipment, status: 'exception' });
    await service.changeShipmentStatus(shipment.id, 'in_transit');

    expect(mockShipmentUpdateStatus).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid transition from pending to delivered', async () => {
    const shipment = makeShipment({ status: 'pending' });
    mockShipmentFindById.mockResolvedValue(shipment);

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    await expect(service.changeShipmentStatus(shipment.id, 'delivered')).rejects.toThrow();
  });

  it('throws ShipmentNotFoundError for nonexistent shipment', async () => {
    mockShipmentFindById.mockResolvedValue(null);

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    await expect(service.changeShipmentStatus('nonexistent', 'booked')).rejects.toThrow('Shipment not found');
  });

  it('adds a tracking event note', async () => {
    const shipment = makeShipment();
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentAddTrackingEvent.mockResolvedValue({ id: 'evt-001' });

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();
    const result = await service.addNote(shipment.id, 'Vehicle loaded onto vessel');

    expect(result).toBeDefined();
    expect(mockShipmentAddTrackingEvent).toHaveBeenCalledWith(shipment.id, null, 'Vehicle loaded onto vessel', undefined);
  });
});

describe('Shipment - Order Status Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates order status when shipment reaches delivered', async () => {
    const shipment = makeShipment({ status: 'arrived', orderId: 'order-001' });
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentUpdateStatus.mockResolvedValue({});
    mockShipmentAddTrackingEvent.mockResolvedValue({});

    const mockUpdate = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });
    const { db } = await import('@/server/db/client');
    vi.mocked(db.update).mockReturnValue({ set: mockUpdate } as any);

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();
    await service.changeShipmentStatus(shipment.id, 'delivered');

    expect(db.update).toHaveBeenCalled();
  });

  it('updates order status when shipment reaches in_transit', async () => {
    const shipment = makeShipment({ status: 'picked_up', orderId: 'order-002' });
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentUpdateStatus.mockResolvedValue({});
    mockShipmentAddTrackingEvent.mockResolvedValue({});

    const mockUpdate = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue({}) });
    const { db } = await import('@/server/db/client');
    vi.mocked(db.update).mockReturnValue({ set: mockUpdate } as any);

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();
    await service.changeShipmentStatus(shipment.id, 'in_transit');

    expect(db.update).toHaveBeenCalled();
  });
});

describe('Shipment - Soft Delete and Restore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soft deletes a shipment', async () => {
    const shipment = makeShipment({ deletedAt: null });
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentSoftDelete.mockResolvedValue({ ...shipment, deletedAt: new Date() });

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();
    const result = await service.softDeleteShipment(shipment.id);

    expect(result).toBeDefined();
  });

  it('cannot soft delete already deleted shipment', async () => {
    const shipment = makeShipment({ deletedAt: new Date() });
    mockShipmentFindById.mockResolvedValue(shipment);

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    await expect(service.softDeleteShipment(shipment.id)).rejects.toThrow('already deleted');
  });

  it('restores a soft-deleted shipment', async () => {
    const shipment = makeShipment({ deletedAt: new Date() });
    mockShipmentFindById.mockResolvedValue(shipment);
    mockShipmentRestore.mockResolvedValue({ ...shipment, deletedAt: null });

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();
    const result = await service.restoreShipment(shipment.id);

    expect(result).toBeDefined();
  });

  it('cannot restore non-deleted shipment', async () => {
    const shipment = makeShipment({ deletedAt: null });
    mockShipmentFindById.mockResolvedValue(shipment);

    const { ShippingService } = await import('@/server/services/shippingService');
    const service = new ShippingService();

    await expect(service.restoreShipment(shipment.id)).rejects.toThrow('not deleted');
  });
});
