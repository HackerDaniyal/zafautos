import { ShippingRepository } from '@/server/repositories';
import { z } from 'zod';
import { ShipmentNotFoundError, ValidationError, InvalidOrderStatusTransitionError } from './errors';
import { isValidShipmentTransition, type ShipmentStatus } from '@/lib/types/shipping';
import { db } from '@/server/db/client';
import { orders } from '@/server/db/schema/orders';
import { shipments } from '@/server/db/schema/shipping';
import { eq, and, ne } from 'drizzle-orm';
import { notificationService } from './notificationService';

// ──────────────────────────────────────────────────────────────
// Validation Schemas
// ──────────────────────────────────────────────────────────────

const SHIPMENT_STATUSES = ['pending', 'booked', 'picked_up', 'in_transit', 'arrived', 'delivered', 'delayed', 'exception', 'cancelled'] as const;

export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  carrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  vessel: z.string().optional().nullable(),
  bookingReference: z.string().optional().nullable(),
  shippingCost: z.number().int().nonnegative().default(0),
  originPortId: z.string().uuid().optional().nullable(),
  destinationPortId: z.string().uuid().optional().nullable(),
  estimatedDeparture: z.date().optional().nullable(),
  estimatedArrival: z.date().optional().nullable(),
  actualDeparture: z.date().optional().nullable(),
  actualArrival: z.date().optional().nullable(),
  status: z.enum(SHIPMENT_STATUSES).default('pending'),
});
export type CreateShipmentDTO = z.infer<typeof CreateShipmentSchema>;

export const AddTrackingEventSchema = z.object({
  shipmentId: z.string().uuid('Invalid shipment ID'),
  location: z.string().optional().nullable(),
  status: z.enum(SHIPMENT_STATUSES),
  eventDate: z.date().default(() => new Date()),
  notes: z.string().optional().nullable(),
});
export type AddTrackingEventDTO = z.infer<typeof AddTrackingEventSchema>;

export const AddContainerSchema = z.object({
  shipmentId: z.string().uuid('Invalid shipment ID'),
  containerNumber: z.string().min(1, 'Container number is required'),
  sealNumber: z.string().optional().nullable(),
  type: z.string().optional().nullable(),
});
export type AddContainerDTO = z.infer<typeof AddContainerSchema>;

const UpdateShipmentSchema = z.object({
  carrier: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  vessel: z.string().optional().nullable(),
  bookingReference: z.string().optional().nullable(),
  shippingCost: z.number().int().nonnegative().optional(),
  originPortId: z.string().uuid().optional().nullable(),
  destinationPortId: z.string().uuid().optional().nullable(),
  estimatedDeparture: z.date().optional().nullable(),
  estimatedArrival: z.date().optional().nullable(),
  actualDeparture: z.date().optional().nullable(),
  actualArrival: z.date().optional().nullable(),
});

const AddDocumentSchema = z.object({
  documentUrl: z.string().url('Invalid document URL'),
  documentType: z.enum(['bill_of_lading', 'export_certificate', 'inspection_report', 'insurance', 'commercial_invoice', 'packing_list', 'photos', 'other']).default('other'),
  documentName: z.string().optional().nullable(),
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Service Layer
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export class ShippingService {
  constructor(private readonly shippingRepo: ShippingRepository = new ShippingRepository()) {}

  /**
   * Retrieves all shipments for a specific order.
   */
  async getShipmentsByOrderId(orderId: string) {
    if (!orderId) {
      throw new ValidationError('Order ID is required');
    }
    return this.shippingRepo.findByOrderId(orderId);
  }

  /**
   * Creates a new shipment for an order.
   * Validates order exists, is not cancelled, and checks for duplicate active shipments.
   */
  async createShipment(data: CreateShipmentDTO) {
    const validatedData = CreateShipmentSchema.parse(data);

    // Validate order exists
    const [order] = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, validatedData.orderId)).limit(1);
    if (!order) {
      throw new ValidationError('Order not found');
    }
    if (order.status === 'cancelled') {
      throw new ValidationError('Cannot create shipment for a cancelled order');
    }

    // Check for existing active shipment on this order
    const [existing] = await db.select({ id: shipments.id })
      .from(shipments)
      .where(and(
        eq(shipments.orderId, validatedData.orderId),
        eq(shipments.deletedAt, null as unknown as Date),
        ne(shipments.status, 'cancelled' as ShipmentStatus),
      ))
      .limit(1);
    if (existing) {
      throw new ValidationError('An active shipment already exists for this order');
    }

    return this.shippingRepo.createShipment(validatedData as unknown as Parameters<typeof this.shippingRepo.createShipment>[0]);
  }

  async getShipmentForEdit(shipmentId: string) {
    if (!shipmentId) {
      throw new ValidationError('Shipment ID is required');
    }
    const shipment = await this.shippingRepo.getShipmentForEdit(shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }
    return shipment;
  }

  /**
   * Lists shipments with filtering, pagination, and sorting.
   */
  async listShipments(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ShipmentStatus;
    orderId?: string;
    carrier?: string;
    dateFrom?: string;
    dateTo?: string;
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    return this.shippingRepo.listShipments(params);
  }

  /**
   * Returns shipment with all related data.
   */
  async getShipmentDetail(shipmentId: string) {
    const shipment = await this.shippingRepo.getShipmentWithRelations(shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }
    return shipment;
  }

  /**
   * Changes shipment status with validation.
   * When status changes to 'delivered', also updates the related order status.
   */
  async changeShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    userId?: string,
    note?: string
  ) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId) as unknown as { id: string; status: string; orderId: string } | null;
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    const currentStatus = shipment.status as ShipmentStatus;
    if (!isValidShipmentTransition(currentStatus, newStatus)) {
      throw new InvalidOrderStatusTransitionError(currentStatus, newStatus);
    }

    await this.shippingRepo.updateShipmentStatus(shipmentId, newStatus);

    // When delivered, update the related order status to 'delivered'
    if (newStatus === 'delivered' && shipment.orderId) {
      await db.update(orders)
        .set({ status: 'delivered', updatedAt: new Date() })
        .where(eq(orders.id, shipment.orderId));
    }

    // When shipped (in_transit), update order to 'shipped'
    if (newStatus === 'in_transit' && shipment.orderId) {
      await db.update(orders)
        .set({ status: 'shipped', updatedAt: new Date() })
        .where(eq(orders.id, shipment.orderId));
    }

    // Add tracking event for status change
    const trackingNote = note || `Status changed from ${currentStatus} to ${newStatus}`;
    await this.shippingRepo.addTrackingEvent(shipmentId, null, trackingNote, userId);

    // Dispatch notifications (non-blocking)
    try {
      const shipmentMessages: Record<string, { title: string; body: string; type: string }> = {
        booked: { title: 'Shipment Booked', body: 'Your vehicle shipment has been booked.', type: 'shipping.booked' },
        picked_up: { title: 'Shipment Picked Up', body: 'Your vehicle has been picked up for shipping.', type: 'shipping.picked_up' },
        in_transit: { title: 'Shipment In Transit', body: 'Your vehicle is now in transit.', type: 'shipping.in_transit' },
        arrived: { title: 'Shipment Arrived', body: 'Your vehicle shipment has arrived at the destination port.', type: 'shipping.arrived' },
        delivered: { title: 'Shipment Delivered', body: 'Your vehicle has been delivered.', type: 'shipping.delivered' },
        delayed: { title: 'Shipment Delayed', body: 'Your shipment has been delayed. Our team will contact you with updates.', type: 'shipping.delayed' },
        exception: { title: 'Shipment Exception', body: 'Your shipment has encountered an issue. Our team will contact you.', type: 'shipping.exception' },
        cancelled: { title: 'Shipment Cancelled', body: 'Your shipment has been cancelled.', type: 'shipping.cancelled' },
      };
      const msg = shipmentMessages[newStatus];
      if (msg && shipment.orderId) {
        const [order] = await db.select({ customerId: orders.customerId, orderNumber: orders.orderNumber }).from(orders).where(eq(orders.id, shipment.orderId)).limit(1);
        if (order?.customerId) {
          await notificationService.dispatch({
            userId: order.customerId,
            type: msg.type,
            category: 'shipping',
            title: msg.title,
            body: msg.body + (order.orderNumber ? ` (Order: ${order.orderNumber})` : ''),
            link: `/account/orders/${shipment.orderId}`,
            metadata: { shipmentId, orderId: shipment.orderId, status: newStatus },
            eventKey: `shipment:${shipmentId}:status:${newStatus}`,
          });
        }
      }
    } catch (err) {
      console.error('Shipping notification dispatch failed (non-blocking):', err);
    }

    return { success: true };
  }

  /**
   * Adds a note as a tracking event.
   */
  async addNote(shipmentId: string, note: string, userId?: string) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    return this.shippingRepo.addTrackingEvent(shipmentId, null, note, userId);
  }

  /**
   * Adds a document to a shipment.
   */
  async addDocument(shipmentId: string, documentUrl: string, userId?: string, documentType?: string, documentName?: string) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    return this.shippingRepo.addDocument(shipmentId, documentUrl, userId, documentType, documentName);
  }

  /**
   * Deletes a document.
   */
  async deleteDocument(documentId: string) {
    return this.shippingRepo.deleteDocument(documentId);
  }

  /**
   * Adds a container to a shipment.
   */
  async addContainerByShipmentId(shipmentId: string, containerNumber: string, userId?: string) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    return this.shippingRepo.addContainer(shipmentId, containerNumber, userId);
  }

  /**
   * Deletes a container.
   */
  async deleteContainer(containerId: string) {
    return this.shippingRepo.deleteContainer(containerId);
  }

  /**
   * Soft deletes a shipment.
   */
  async softDeleteShipment(shipmentId: string, userId?: string) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId) as unknown as { deletedAt: Date | null } | null;
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    if (shipment.deletedAt) {
      throw new ValidationError('Shipment is already deleted');
    }

    return this.shippingRepo.softDeleteShipment(shipmentId, userId);
  }

  /**
   * Restores a soft-deleted shipment.
   */
  async restoreShipment(shipmentId: string) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId) as unknown as { deletedAt: Date | null } | null;
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    if (!shipment.deletedAt) {
      throw new ValidationError('Shipment is not deleted');
    }

    return this.shippingRepo.restoreShipment(shipmentId);
  }

  /**
   * Bulk updates status for multiple shipments.
   */
  async bulkUpdateStatus(ids: string[], status: ShipmentStatus, userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.changeShipmentStatus(id, status, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }

  /**
   * Bulk soft deletes multiple shipments.
   */
  async bulkDelete(ids: string[], userId?: string) {
    const results = [];
    for (const id of ids) {
      try {
        await this.softDeleteShipment(id, userId);
        results.push({ id, success: true });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return results;
  }

  /**
   * Returns shipment statistics.
   */
  async getShipmentStats() {
    return this.shippingRepo.getShipmentStats();
  }

  /**
   * Lists all active ports.
   */
  async listPorts() {
    return this.shippingRepo.ports.findMany({});
  }

  /**
   * Updates shipment details.
   */
  async updateShipment(
    shipmentId: string,
    data: {
      carrier?: string;
      orderId?: string;
      trackingNumber?: string;
      vessel?: string;
      bookingReference?: string;
      shippingCost?: number;
      originPortId?: string | null;
      destinationPortId?: string | null;
      estimatedDeparture?: Date | null;
      estimatedArrival?: Date | null;
      actualDeparture?: Date | null;
      actualArrival?: Date | null;
    },
    userId?: string,
  ) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId) as unknown as { id: string; deletedAt: Date | null } | null;
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }
    if (shipment.deletedAt) {
      throw new ValidationError('Cannot update a deleted shipment');
    }

    const validated = UpdateShipmentSchema.partial().parse(data);

    return this.shippingRepo.shipments.update(shipmentId, {
      ...validated,
      updatedBy: userId ?? null,
    } as Parameters<typeof this.shippingRepo.shipments.update>[1]);
  }
}
