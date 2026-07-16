import { containers, ports, shipments, shipmentTracking, shippingDocuments } from '@/server/db/schema';
import type { InferModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { BaseRepository } from './baseRepository';

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

  async addTrackingEvent(data: InferModel<typeof shipmentTracking, 'insert'>) {
    return this.tracking.create(data);
  }

  async addContainer(data: InferModel<typeof containers, 'insert'>) {
    return this.containers.create(data);
  }

  async addDocument(data: InferModel<typeof shippingDocuments, 'insert'>) {
    return this.documents.create(data);
  }
}
