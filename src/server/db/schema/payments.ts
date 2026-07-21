import { index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { paymentStatusEnum } from './common';
import { orders } from './orders';

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  amount: integer('amount').default(0).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('payments_order_idx').on(table.orderId),
  userIdx: index('payments_user_idx').on(table.userId),
}));

export const paymentHistory = pgTable('payment_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'cascade' }).notNull(),
  status: paymentStatusEnum('status').default('pending').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  paymentIdx: index('payment_history_payment_idx').on(table.paymentId),
}));

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  provider: varchar('provider', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  userIdx: index('payment_methods_user_idx').on(table.userId),
}));

export const currencies = pgTable('currencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const exchangeRates = pgTable('exchange_rates', {
  id: uuid('id').defaultRandom().primaryKey(),
  currencyId: uuid('currency_id').references(() => currencies.id, { onDelete: 'cascade' }).notNull(),
  rate: integer('rate').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  currencyIdx: index('exchange_rates_currency_idx').on(table.currencyId),
}));

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('invoices_order_idx').on(table.orderId),
}));
