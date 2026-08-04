import { boolean, index, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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
  paymentMethod: varchar('payment_method', { length: 50 }).default('manual'),
  referenceNumber: varchar('reference_number', { length: 255 }),
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
  type: varchar('type', { length: 50 }).default('manual'),
  isDefault: integer('is_default').default(0),
  details: text('details'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  userIdx: index('payment_methods_user_idx').on(table.userId),
}));

export const currencySymbolPositionEnum = pgEnum('currency_symbol_position', ['before', 'after']);

export const currencies = pgTable('currencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 10 }),
  decimalPlaces: integer('decimal_places').default(2).notNull(),
  symbolPosition: currencySymbolPositionEnum('symbol_position').default('before').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 16, scale: 6 }).default('1').notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  oneDefaultIdx: uniqueIndex('currencies_one_default_idx').on(table.isDefault).where(sql`is_default = true`),
}));

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

export const invoiceStatusEnum = pgEnum('invoice_status_enum', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  invoiceDate: timestamp('invoice_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  tax: integer('tax').default(0).notNull(),
  discount: integer('discount').default(0).notNull(),
  shipping: integer('shipping').default(0).notNull(),
  subtotal: integer('subtotal').default(0).notNull(),
  total: integer('total').default(0).notNull(),
  balanceDue: integer('balance_due').default(0).notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  orderIdx: index('invoices_order_idx').on(table.orderId),
  invoiceNumberIdx: index('invoices_invoice_number_idx').on(table.invoiceNumber),
  statusIdx: index('invoices_status_idx').on(table.status),
}));

export const paymentTransactions = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  amount: integer('amount').default(0).notNull(),
  method: varchar('method', { length: 50 }).default('manual').notNull(),
  referenceNumber: varchar('reference_number', { length: 255 }),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).defaultNow().notNull(),
  receipt: text('receipt'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  paymentIdx: index('payment_transactions_payment_idx').on(table.paymentId),
  orderIdx: index('payment_transactions_order_idx').on(table.orderId),
  typeIdx: index('payment_transactions_type_idx').on(table.type),
}));
