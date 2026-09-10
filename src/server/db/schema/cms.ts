import { boolean, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { vehicles } from './vehicles';
import { cmsPageStatusEnum, homepageSectionTypeEnum, menuLocationEnum, blogPostStatusEnum } from './common';

// ── CMS Pages ──────────────────────────────────────────────────────────────────

export const cmsPages = pgTable('cms_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  status: cmsPageStatusEnum('status').default('draft').notNull(),
  featuredImageUrl: text('featured_image_url'),
  seoTitle: varchar('seo_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  canonicalUrl: varchar('canonical_url', { length: 500 }),
  ogImage: text('og_image'),
  robotsIndex: boolean('robots_index').default(true).notNull(),
  robotsFollow: boolean('robots_follow').default(true).notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  slugIdx: index('cms_pages_slug_idx').on(table.slug),
  statusIdx: index('cms_pages_status_idx').on(table.status),
}));

// ── CMS Page Versions ──────────────────────────────────────────────────────────

export const cmsPageVersions = pgTable('cms_page_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').references(() => cmsPages.id, { onDelete: 'cascade' }).notNull(),
  content: text('content'),
  title: varchar('title', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }),
  seoTitle: varchar('seo_title', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  versionNumber: integer('version_number').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
}, (table) => ({
  pageIdIdx: index('cms_page_versions_page_id_idx').on(table.pageId),
}));

// ── Homepage Sections ──────────────────────────────────────────────────────────

export const homepageSections = pgTable('homepage_sections', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: homepageSectionTypeEnum('type').notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  title: varchar('title', { length: 255 }),
  subtitle: text('subtitle'),
  content: text('content'),
  imageUrl: text('image_url'),
  imageAlt: varchar('image_alt', { length: 255 }),
  buttonLabel: varchar('button_label', { length: 100 }),
  buttonUrl: varchar('button_url', { length: 500 }),
  button2Label: varchar('button2_label', { length: 100 }),
  button2Url: varchar('button2_url', { length: 500 }),
  extraData: jsonb('extra_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  typeIdx: index('homepage_sections_type_idx').on(table.type),
  displayOrderIdx: index('homepage_sections_display_order_idx').on(table.displayOrder),
  isEnabledIdx: index('homepage_sections_is_enabled_idx').on(table.isEnabled),
}));

// ── Menus ──────────────────────────────────────────────────────────────────────

export const menus = pgTable('menus', {
  id: uuid('id').defaultRandom().primaryKey(),
  location: menuLocationEnum('location').notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  url: varchar('url', { length: 500 }),
  pageSlug: varchar('page_slug', { length: 255 }),
  externalUrl: varchar('external_url', { length: 500 }),
  openInNewTab: boolean('open_in_new_tab').default(false).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  locationIdx: index('menus_location_idx').on(table.location),
  parentIdIdx: index('menus_parent_id_idx').on(table.parentId),
  displayOrderIdx: index('menus_display_order_idx').on(table.displayOrder),
}));

// ── Banners ────────────────────────────────────────────────────────────────────

export const banners = pgTable('banners', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  mobileImageUrl: text('mobile_image_url'),
  buttonText: varchar('button_text', { length: 100 }),
  buttonLink: varchar('button_link', { length: 500 }),
  placement: varchar('placement', { length: 50 }).default('homepage').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  placementIdx: index('banners_placement_idx').on(table.placement),
  isActiveIdx: index('banners_is_active_idx').on(table.isActive),
  displayOrderIdx: index('banners_display_order_idx').on(table.displayOrder),
}));

// ── Testimonials ───────────────────────────────────────────────────────────────

export const testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerLocation: varchar('customer_location', { length: 255 }),
  customerImageUrl: text('customer_image_url'),
  quote: text('quote').notNull(),
  rating: integer('rating').default(5),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  videoUrl: text('video_url'),
  isPublished: boolean('is_published').default(false).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  isPublishedIdx: index('testimonials_is_published_idx').on(table.isPublished),
  displayOrderIdx: index('testimonials_display_order_idx').on(table.displayOrder),
}));

// ── FAQs ───────────────────────────────────────────────────────────────────────

export const faqs = pgTable('faqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  question: varchar('question', { length: 500 }).notNull(),
  answer: text('answer').notNull(),
  category: varchar('category', { length: 100 }).default('general'),
  displayOrder: integer('display_order').default(0).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  categoryIdx: index('faqs_category_idx').on(table.category),
  isPublishedIdx: index('faqs_is_published_idx').on(table.isPublished),
  displayOrderIdx: index('faqs_display_order_idx').on(table.displayOrder),
}));

// ── Blog Posts ─────────────────────────────────────────────────────────────────

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content'),
  featuredImageUrl: text('featured_image_url'),
  author: varchar('author', { length: 255 }),
  category: varchar('category', { length: 100 }),
  tags: text('tags'),
  status: blogPostStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  canonicalUrl: varchar('canonical_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  slugIdx: index('blog_posts_slug_idx').on(table.slug),
  statusIdx: index('blog_posts_status_idx').on(table.status),
  categoryIdx: index('blog_posts_category_idx').on(table.category),
  publishedAtIdx: index('blog_posts_published_at_idx').on(table.publishedAt),
}));

// ── Media Uploads ──────────────────────────────────────────────────────────────

export const mediaUploads = pgTable('media_uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'),
  width: integer('width'),
  height: integer('height'),
  altText: varchar('alt_text', { length: 255 }),
  uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'),
}, (table) => ({
  mimeTypeIdx: index('media_uploads_mime_type_idx').on(table.mimeType),
  uploadedByIdx: index('media_uploads_uploaded_by_idx').on(table.uploadedBy),
}));
