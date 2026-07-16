import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { vehicles } from './vehicles';

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  userIdx: index('customers_user_idx').on(table.userId),
}));

export const customerProfiles = pgTable('customer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  customerIdx: index('customer_profiles_customer_idx').on(table.customerId),
}));

export const customerSettings = pgTable('customer_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  preferences: text('preferences'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  customerIdx: index('customer_settings_customer_idx').on(table.customerId),
}));

export const customerAddresses = pgTable('customer_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  addressLine: text('address_line'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  customerIdx: index('customer_addresses_customer_idx').on(table.customerId),
}));

export const customerWishlist = pgTable('customer_wishlist', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  customerIdx: index('customer_wishlist_customer_idx').on(table.customerId),
  customerVehicleIdx: index('customer_wishlist_customer_vehicle_idx').on(table.customerId, table.vehicleId),
}));

export const customerAlerts = pgTable('customer_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }).notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  customerIdx: index('customer_alerts_customer_idx').on(table.customerId),
}));
