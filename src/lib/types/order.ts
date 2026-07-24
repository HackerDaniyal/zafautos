import type { orders, orderItems, orderStatus, orderTimeline, orderDocuments, orderNotes } from '@/server/db/schema';
import type { payments } from '@/server/db/schema/payments';
import type { shipments } from '@/server/db/schema/shipping';

export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatusRecord = typeof orderStatus.$inferSelect;
export type OrderTimelineEvent = typeof orderTimeline.$inferSelect;
export type OrderDocument = typeof orderDocuments.$inferSelect;
export type OrderNote = typeof orderNotes.$inferSelect;

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['cancelled'],
  cancelled: [],
};

export function isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface OrderWithRelations extends Order {
  customerName?: string;
  customerEmail?: string;
  dealerName?: string;
  dealerEmail?: string;
  vehicleTitle?: string;
  vehicleVin?: string;
  vehicleStockNumber?: string;
  vehicleImageUrl?: string;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  statusHistory: OrderStatusRecord[];
  timeline: OrderTimelineEvent[];
  documents: OrderDocument[];
  notes: OrderNote[];
  payments: (typeof payments.$inferSelect)[];
  shipments: (typeof shipments.$inferSelect)[];
  customer: {
    id: string;
    email: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      country: string | null;
    } | null;
  } | null;
  dealer: {
    id: string;
    email: string;
    profile: {
      companyName: string | null;
      phone: string | null;
    } | null;
  } | null;
  vehicle: {
    id: string;
    title: string | null;
    vin: string | null;
    stockNumber: string | null;
    price: number | null;
    status: string | null;
    year: number | null;
    images: {
      imageUrl: string;
      isPrimary: boolean | null;
    }[];
  } | null;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  customerId?: string;
  dealerId?: string;
  vehicleId?: string;
  paymentStatus?: string;
  shippingStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}
