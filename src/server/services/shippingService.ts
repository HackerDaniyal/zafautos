import { ShippingRepository } from '@/server/repositories';
import { z } from 'zod';
import { ShipmentNotFoundError, ValidationError, InvalidOrderStatusTransitionError } from './errors';
import { isValidShipmentTransition, type ShipmentStatus } from '@/lib/types/shipping';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Validation Schemas
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  carrier: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'delayed', 'cancelled']).default('pending'),
});
export type CreateShipmentDTO = z.infer<typeof CreateShipmentSchema>;

export const AddTrackingEventSchema = z.object({
  shipmentId: z.string().uuid('Invalid shipment ID'),
  location: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_transit', 'delivered', 'delayed', 'cancelled']),
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
   */
  async createShipment(data: CreateShipmentDTO) {
    const validatedData = CreateShipmentSchema.parse(data);
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
   */
  async changeShipmentStatus(
    shipmentId: string,
    newStatus: ShipmentStatus,
    userId?: string,
    note?: string
  ) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId) as unknown as { id: string; status: string } | null;
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    const currentStatus = shipment.status as ShipmentStatus;
    if (!isValidShipmentTransition(currentStatus, newStatus)) {
      throw new InvalidOrderStatusTransitionError(currentStatus, newStatus);
    }

    await this.shippingRepo.updateShipmentStatus(shipmentId, newStatus);

    // Add tracking event for status change
    const trackingNote = note || `Status changed from ${currentStatus} to ${newStatus}`;
    await this.shippingRepo.addTrackingEvent(shipmentId, null, trackingNote, userId);

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
  async addDocument(shipmentId: string, documentUrl: string, userId?: string) {
    const shipment = await this.shippingRepo.shipments.findById(shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(shipmentId);
    }

    return this.shippingRepo.addDocument(shipmentId, documentUrl, userId);
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
   * Updates shipment details.
   */
  async updateShipment(
    shipmentId: string,
    data: {
      carrier?: string;
      orderId?: string;
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

    return this.shippingRepo.shipments.update(shipmentId, {
      ...data,
      updatedBy: userId ?? null,
    } as Parameters<typeof this.shippingRepo.shipments.update>[1]);
  }
}
