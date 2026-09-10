import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { leadSourceEnum, leadStatusEnum } from './common';
import { vehicles } from './vehicles';

export const featuredVehicles = pgTable('featured_vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  vehicleIdx: index('featured_vehicles_vehicle_idx').on(table.vehicleId),
}));

export const vehicleViews = pgTable('vehicle_views', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  vehicleIdx: index('vehicle_views_vehicle_idx').on(table.vehicleId),
  userIdx: index('vehicle_views_user_idx').on(table.userId),
}));

export const vehicleCompare = pgTable('vehicle_compare', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  userIdx: index('vehicle_compare_user_idx').on(table.userId),
  vehicleIdx: index('vehicle_compare_vehicle_idx').on(table.vehicleId),
  userVehicleIdx: index('vehicle_compare_user_vehicle_idx').on(table.userId, table.vehicleId),
}));

export const vehicleWishlist = pgTable('vehicle_wishlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  userIdx: index('vehicle_wishlist_user_idx').on(table.userId),
  vehicleIdx: index('vehicle_wishlist_vehicle_idx').on(table.vehicleId),
  userVehicleIdx: index('vehicle_wishlist_user_vehicle_idx').on(table.userId, table.vehicleId),
  userVehicleUniqueIdx: uniqueIndex('vehicle_wishlist_user_vehicle_unique_idx').on(table.userId, table.vehicleId),
}));

export const vehicleEnquiries = pgTable('vehicle_enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'restrict' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  status: leadStatusEnum('status').default('new').notNull(),
  source: leadSourceEnum('source').default('website').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  customerName: varchar('customer_name', { length: 255 }),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 50 }),
  customerCountry: varchar('customer_country', { length: 100 }),
  contactedAt: timestamp('contacted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  vehicleIdx: index('vehicle_enquiries_vehicle_idx').on(table.vehicleId),
  userIdx: index('vehicle_enquiries_user_idx').on(table.userId),
  statusIdx: index('vehicle_enquiries_status_idx').on(table.status),
  assignedToIdx: index('vehicle_enquiries_assigned_to_idx').on(table.assignedTo),
  createdAtIdx: index('vehicle_enquiries_created_at_idx').on(table.createdAt),
}));

export const leadNotes = pgTable('lead_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  leadId: uuid('lead_id').references(() => vehicleEnquiries.id, { onDelete: 'cascade' }).notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  leadIdx: index('lead_notes_lead_idx').on(table.leadId),
}));

export const whatsappClicks = pgTable('whatsapp_clicks', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  source: varchar('source', { length: 100 }).default('vehicle_detail').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  vehicleIdx: index('whatsapp_clicks_vehicle_idx').on(table.vehicleId),
  userIdx: index('whatsapp_clicks_user_idx').on(table.userId),
}));
