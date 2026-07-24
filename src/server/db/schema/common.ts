import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role_enum', ['customer', 'dealer', 'admin', 'super_admin']);
export const userStatusEnum = pgEnum('user_status_enum', ['active', 'pending', 'suspended', 'blocked']);
export const vehicleStatusEnum = pgEnum('vehicle_status_enum', ['draft', 'active', 'sold', 'archived']);
export const orderStatusEnum = pgEnum('order_status_enum', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status_enum', ['pending', 'paid', 'failed', 'refunded']);
export const shipmentStatusEnum = pgEnum('shipment_status_enum', ['pending', 'in_transit', 'delivered', 'delayed', 'cancelled']);
export const notificationStatusEnum = pgEnum('notification_status_enum', ['unread', 'read', 'archived']);
