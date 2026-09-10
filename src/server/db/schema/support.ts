import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { customers } from './customers';
import { orders } from './orders';
import { supportTicketStatusEnum, supportTicketPriorityEnum, supportTicketCategoryEnum, supportSenderTypeEnum } from './common';

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  subject: varchar('subject', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: supportTicketCategoryEnum('category').default('general').notNull(),
  priority: supportTicketPriorityEnum('priority').default('medium').notNull(),
  status: supportTicketStatusEnum('status').default('open').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  customerIdx: index('support_tickets_customer_idx').on(table.customerId),
  orderIdx: index('support_tickets_order_idx').on(table.orderId),
  statusIdx: index('support_tickets_status_idx').on(table.status),
  priorityIdx: index('support_tickets_priority_idx').on(table.priority),
  categoryIdx: index('support_tickets_category_idx').on(table.category),
  assignedToIdx: index('support_tickets_assigned_to_idx').on(table.assignedTo),
  createdAtIdx: index('support_tickets_created_at_idx').on(table.createdAt),
}));

export const supportTicketMessages = pgTable('support_ticket_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').references(() => supportTickets.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
  senderType: supportSenderTypeEnum('sender_type').default('customer').notNull(),
  message: text('message').notNull(),
  attachmentUrl: text('attachment_url'),
  attachmentName: varchar('attachment_name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  ticketIdx: index('support_ticket_messages_ticket_idx').on(table.ticketId),
  senderIdx: index('support_ticket_messages_sender_idx').on(table.senderId),
  createdAtIdx: index('support_ticket_messages_created_at_idx').on(table.createdAt),
}));
