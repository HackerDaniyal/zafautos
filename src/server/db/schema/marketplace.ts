import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
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
}));

export const vehicleEnquiries = pgTable('vehicle_enquiries', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  vehicleIdx: index('vehicle_enquiries_vehicle_idx').on(table.vehicleId),
  userIdx: index('vehicle_enquiries_user_idx').on(table.userId),
}));
