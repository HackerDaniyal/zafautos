import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { orders } from './orders';

export const dealers = pgTable('dealers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  userIdx: index('dealers_user_idx').on(table.userId),
}));

export const dealerProfiles = pgTable('dealer_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerId: uuid('dealer_id').references(() => dealers.id, { onDelete: 'cascade' }).notNull(),
  displayName: varchar('display_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  dealerIdx: index('dealer_profiles_dealer_idx').on(table.dealerId),
}));

export const dealerAssignments = pgTable('dealer_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerId: uuid('dealer_id').references(() => dealers.id, { onDelete: 'cascade' }).notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  dealerIdx: index('dealer_assignments_dealer_idx').on(table.dealerId),
  dealerOrderIdx: index('dealer_assignments_dealer_order_idx').on(table.dealerId, table.orderId),
}));

export const dealerActivity = pgTable('dealer_activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  dealerId: uuid('dealer_id').references(() => dealers.id, { onDelete: 'cascade' }).notNull(),
  activity: text('activity').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  dealerIdx: index('dealer_activity_dealer_idx').on(table.dealerId),
}));
