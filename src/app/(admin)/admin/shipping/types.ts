export type {
  Shipment,
  ShipmentInsert,
  ShipmentTrackingEvent,
  Container,
  Port,
  ShippingDocument,
  ShipmentStatus,
  ShipmentWithRelations,
  ShipmentDetail,
  ShippingListParams,
  ShipmentStats,
} from '@/lib/types/shipping';

export {
  SHIPMENT_STATUS_TRANSITIONS,
  SHIPPING_STATUS_TRANSITIONS,
  isValidShipmentTransition,
} from '@/lib/types/shipping';
