import { boolean, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { vehicleStatusEnum } from './common';
import { currencies } from './payments';
import { countries } from './settings';
import { ports } from './shipping';

export const manufacturers = pgTable('manufacturers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  countryId: uuid('country_id').references(() => countries.id, { onDelete: 'set null' }),
  logoUrl: varchar('logo_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  slugIdx: index('manufacturers_slug_idx').on(table.slug),
}));

export const models = pgTable('models', {
  id: uuid('id').defaultRandom().primaryKey(),
  manufacturerId: uuid('manufacturer_id').references(() => manufacturers.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  manufacturerIdx: index('models_manufacturer_idx').on(table.manufacturerId),
  slugIdx: index('models_slug_idx').on(table.slug),
}));

export const bodyTypes = pgTable('body_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const fuelTypes = pgTable('fuel_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const transmissions = pgTable('transmissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const driveTypes = pgTable('drive_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const colors = pgTable('colors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
});

export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  vin: varchar('vin', { length: 50 }).unique(),
  stockNumber: varchar('stock_number', { length: 100 }),
  manufacturerId: uuid('manufacturer_id').references(() => manufacturers.id, { onDelete: 'set null' }),
  modelId: uuid('model_id').references(() => models.id, { onDelete: 'set null' }),
  bodyTypeId: uuid('body_type_id').references(() => bodyTypes.id, { onDelete: 'set null' }),
  fuelTypeId: uuid('fuel_type_id').references(() => fuelTypes.id, { onDelete: 'set null' }),
  transmissionId: uuid('transmission_id').references(() => transmissions.id, { onDelete: 'set null' }),
  driveTypeId: uuid('drive_type_id').references(() => driveTypes.id, { onDelete: 'set null' }),
  colorId: uuid('color_id').references(() => colors.id, { onDelete: 'set null' }),
  year: integer('year'),
  engineCc: integer('engine_cc'),
  horsepower: integer('horsepower'),
  mileage: integer('mileage'),
  doors: integer('doors'),
  seats: integer('seats'),
  price: integer('price'),
  currencyId: uuid('currency_id').references(() => currencies.id, { onDelete: 'set null' }),
  auctionGrade: varchar('auction_grade', { length: 50 }),
  condition: varchar('condition', { length: 50 }),
  countryId: uuid('country_id').references(() => countries.id, { onDelete: 'set null' }),
  portId: uuid('port_id').references(() => ports.id, { onDelete: 'set null' }),
  status: vehicleStatusEnum('status').default('draft').notNull(),
  slug: varchar('slug', { length: 255 }).unique(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vinIdx: index('vehicles_vin_idx').on(table.vin),
  slugIdx: index('vehicles_slug_idx').on(table.slug),
  manufacturerIdx: index('vehicles_manufacturer_idx').on(table.manufacturerId),
  modelIdx: index('vehicles_model_idx').on(table.modelId),
  countryIdx: index('vehicles_country_idx').on(table.countryId),
  bodyTypeIdx: index('vehicles_body_type_idx').on(table.bodyTypeId),
  fuelTypeIdx: index('vehicles_fuel_type_idx').on(table.fuelTypeId),
  transmissionIdx: index('vehicles_transmission_idx').on(table.transmissionId),
  driveTypeIdx: index('vehicles_drive_type_idx').on(table.driveTypeId),
  colorIdx: index('vehicles_color_idx').on(table.colorId),
  statusIdx: index('vehicles_status_idx').on(table.status),
  priceIdx: index('vehicles_price_idx').on(table.price),
  yearIdx: index('vehicles_year_idx').on(table.year),
  currencyIdx: index('vehicles_currency_idx').on(table.currencyId),
  portIdx: index('vehicles_port_idx').on(table.portId),
}));

export const vehicleImages = pgTable('vehicle_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  imageUrl: text('image_url').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vehicleIdx: index('vehicle_images_vehicle_idx').on(table.vehicleId),
}));

export const vehicleVideos = pgTable('vehicle_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  videoUrl: text('video_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vehicleIdx: index('vehicle_videos_vehicle_idx').on(table.vehicleId),
}));

export const vehicleDocuments = pgTable('vehicle_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  documentUrl: text('document_url').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vehicleIdx: index('vehicle_documents_vehicle_idx').on(table.vehicleId),
}));

export const vehicleFeatures = pgTable('vehicle_features', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vehicleIdx: index('vehicle_features_vehicle_idx').on(table.vehicleId),
}));

export const vehicleSpecifications = pgTable('vehicle_specifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  value: text('value'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vehicleIdx: index('vehicle_specifications_vehicle_idx').on(table.vehicleId),
}));

export const vehicleStatus = pgTable('vehicle_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'cascade' }).notNull(),
  status: vehicleStatusEnum('status').default('draft').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  vehicleIdx: index('vehicle_status_vehicle_idx').on(table.vehicleId),
}));
