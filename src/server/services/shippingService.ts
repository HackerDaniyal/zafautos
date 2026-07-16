import { ShippingRepository } from '@/server/repositories';
import { z } from 'zod';
import { ShipmentNotFoundError, ValidationError } from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  shippingCompany: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  estimatedDeparture: z.date().optional().nullable(),
  estimatedArrival: z.date().optional().nullable(),
  actualDeparture: z.date().optional().nullable(),
  actualArrival: z.date().optional().nullable(),
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

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

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

  /**
   * Adds a tracking event to a shipment.
   */
  async addTrackingEvent(data: AddTrackingEventDTO) {
    const validatedData = AddTrackingEventSchema.parse(data);
    
    // Typically verify shipment exists first
    const shipment = await this.shippingRepo.shipments.findById(validatedData.shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(validatedData.shipmentId);
    }

    return this.shippingRepo.addTrackingEvent(validatedData as unknown as Parameters<typeof this.shippingRepo.addTrackingEvent>[0]);
  }

  /**
   * Associates a shipping container with a shipment.
   */
  async addContainer(data: AddContainerDTO) {
    const validatedData = AddContainerSchema.parse(data);

    // Verify shipment exists
    const shipment = await this.shippingRepo.shipments.findById(validatedData.shipmentId);
    if (!shipment) {
      throw new ShipmentNotFoundError(validatedData.shipmentId);
    }

    return this.shippingRepo.addContainer(validatedData as unknown as Parameters<typeof this.shippingRepo.addContainer>[0]);
  }
}
