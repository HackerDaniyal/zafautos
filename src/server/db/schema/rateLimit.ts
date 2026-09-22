import { index, uniqueIndex, pgTable, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';

export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  routeKey: varchar('route_key', { length: 255 }).notNull(),
  requestCount: integer('request_count').notNull().default(1),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (table) => ({
  idxRouteKey: index('rate_limits_identifier_route_idx').on(table.identifier, table.routeKey),
  uqIdentifierRouteWindow: uniqueIndex('rate_limits_identifier_route_window_idx').on(table.identifier, table.routeKey, table.windowStart),
}));
