import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { orderStatusEnum } from './common';
import { customers } from './customers';
import { dealers } from './dealers';
import { vehicles } from './vehicles';

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: varchar('order_number', { length: 100 }).notNull().unique(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  dealerId: uuid('dealer_id').references(() => dealers.id, { onDelete: 'set null' }),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  status: orderStatusEnum('status').default('pending').notNull(),
  totalAmount: integer('total_amount').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderNumberIdx: index('orders_order_number_idx').on(table.orderNumber),
  customerIdx: index('orders_customer_idx').on(table.customerId),
  dealerIdx: index('orders_dealer_idx').on(table.dealerId),
  vehicleIdx: index('orders_vehicle_idx').on(table.vehicleId),
  statusIdx: index('orders_status_idx').on(table.status),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  quantity: integer('quantity').default(1).notNull(),
  price: integer('price').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('order_items_order_idx').on(table.orderId),
  vehicleIdx: index('order_items_vehicle_idx').on(table.vehicleId),
  orderVehicleIdx: index('order_items_order_vehicle_idx').on(table.orderId, table.vehicleId),
}));

export const orderStatus = pgTable('order_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('order_status_order_idx').on(table.orderId),
}));

export const orderTimeline = pgTable('order_timeline', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  event: text('event').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('order_timeline_order_idx').on(table.orderId),
}));

export const orderDocuments = pgTable('order_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  documentUrl: text('document_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('order_documents_order_idx').on(table.orderId),
}));

export const orderNotes = pgTable('order_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('order_notes_order_idx').on(table.orderId),
}));
