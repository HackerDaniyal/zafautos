import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { notificationStatusEnum } from './common';

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'set null' }),
  recipientId: uuid('recipient_id').references(() => users.id, { onDelete: 'set null' }),
  threadId: uuid('thread_id').references(() => messageThreads.id, { onDelete: 'set null' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  attachments: text('attachments'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  senderIdx: index('messages_sender_idx').on(table.senderId),
  recipientIdx: index('messages_recipient_idx').on(table.recipientId),
  threadIdx: index('messages_thread_idx').on(table.threadId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
}));

export const messageThreads = pgTable('message_threads', {
  id: uuid('id').defaultRandom().primaryKey(),
  subject: varchar('subject', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  status: notificationStatusEnum('status').default('unread').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  userIdx: index('notifications_user_idx').on(table.userId),
  statusIdx: index('notifications_status_idx').on(table.status),
}));

export const emailLogs = pgTable('email_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  recipientIdx: index('email_logs_recipient_idx').on(table.recipient),
}));
