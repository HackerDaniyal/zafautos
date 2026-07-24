import type { shipments, shipmentTracking, containers, ports, shippingDocuments } from '@/server/db/schema';
import type { orders } from '@/server/db/schema/orders';
import type { customers } from '@/server/db/schema/customers';
import type { dealers } from '@/server/db/schema/dealers';
import type { vehicles } from '@/server/db/schema/vehicles';

export type Shipment = typeof shipments.$inferSelect;
export type ShipmentInsert = typeof shipments.$inferInsert;
export type ShipmentTrackingEvent = typeof shipmentTracking.$inferSelect;
export type Container = typeof containers.$inferSelect;
export type Port = typeof ports.$inferSelect;
export type ShippingDocument = typeof shippingDocuments.$inferSelect;

export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';

export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['in_transit', 'cancelled'],
  in_transit: ['delivered', 'delayed', 'cancelled'],
  delivered: [],
  delayed: ['in_transit', 'cancelled'],
  cancelled: [],
};

export const SHIPPING_STATUS_TRANSITIONS = SHIPMENT_STATUS_TRANSITIONS;

export function isValidShipmentTransition(from: ShipmentStatus, to: ShipmentStatus): boolean {
  return SHIPMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface ShipmentWithRelations extends Shipment {
  orderNumber?: string;
  customerName?: string;
  dealerName?: string;
  vehicleTitle?: string;
  vehicleVin?: string;
  vehicleStockNumber?: string;
  containerCount?: number;
  trackingCount?: number;
}

export interface ShipmentDetail extends Shipment {
  tracking: ShipmentTrackingEvent[];
  containers: Container[];
  documents: ShippingDocument[];
  order?: {
    id: string;
    orderNumber: string;
    customerId: string | null;
    dealerId: string | null;
    vehicleId: string | null;
    status: string;
    totalAmount: number;
  };
  customer?: {
    id: string;
    displayName?: string;
    email?: string;
  } | null;
  dealer?: {
    id: string;
    displayName?: string;
  } | null;
  vehicle?: {
    id: string;
    year?: number;
    vin?: string;
    stockNumber?: string;
    manufacturerId?: string;
    modelId?: string;
  } | null;
}

export interface ShippingListParams {
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
}

export interface ShipmentStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  delayedShipments: number;
  cancelledShipments: number;
  byStatus: Array<{ status: string; count: number }>;
}
