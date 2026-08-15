/**
 * Action label registry — derived from all 62 actual `auditService.logAction()` calls
 * in the codebase. Each action string maps to a human-readable label and category.
 *
 * DO NOT invent actions here. Only add entries for strings that exist in server code.
 */

interface ActionMeta {
  label: string;
  category: string;
}

const REGISTRY: Record<string, ActionMeta> = {
  // ── Company ──────────────────────────────────────────────────────────────
  'company.updated':                  { label: 'Company Settings Updated',     category: 'Settings' },

  // ── Continents ───────────────────────────────────────────────────────────
  'continent.created':                { label: 'Continent Created',            category: 'Reference Data' },
  'continent.updated':                { label: 'Continent Updated',            category: 'Reference Data' },
  'continent.deleted':                { label: 'Continent Deleted',            category: 'Reference Data' },
  'continent.restored':               { label: 'Continent Restored',           category: 'Reference Data' },

  // ── Countries ────────────────────────────────────────────────────────────
  'country.created':                  { label: 'Country Created',              category: 'Reference Data' },
  'country.updated':                  { label: 'Country Updated',              category: 'Reference Data' },
  'country.deleted':                  { label: 'Country Deleted',              category: 'Reference Data' },
  'country.restored':                 { label: 'Country Restored',             category: 'Reference Data' },
  'country.initialized':             { label: 'Reference Data Initialized',   category: 'Reference Data' },

  // ── Currencies ───────────────────────────────────────────────────────────
  'currency.created':                 { label: 'Currency Created',             category: 'Reference Data' },
  'currency.updated':                 { label: 'Currency Updated',             category: 'Reference Data' },
  'currency.deleted':                 { label: 'Currency Deleted',             category: 'Reference Data' },
  'currency.restored':                { label: 'Currency Restored',            category: 'Reference Data' },

  // ── Email Templates ──────────────────────────────────────────────────────
  'email_template.created':           { label: 'Email Template Created',       category: 'Settings' },
  'email_template.updated':           { label: 'Email Template Updated',       category: 'Settings' },
  'email_template.deleted':           { label: 'Email Template Deleted',       category: 'Settings' },
  'email_template.restored':          { label: 'Email Template Restored',      category: 'Settings' },

  // ── Invoices ─────────────────────────────────────────────────────────────
  'invoice.created':                  { label: 'Invoice Created',              category: 'Payment' },
  'invoice.updated':                  { label: 'Invoice Updated',              category: 'Payment' },
  'invoice.status_changed':           { label: 'Invoice Status Changed',       category: 'Payment' },
  'invoice.deleted':                  { label: 'Invoice Deleted',              category: 'Payment' },
  'invoice.restored':                 { label: 'Invoice Restored',             category: 'Payment' },
  'invoice.duplicated':               { label: 'Invoice Duplicated',           category: 'Payment' },

  // ── Media ────────────────────────────────────────────────────────────────
  'media.uploaded':                   { label: 'File Uploaded',                category: 'Media' },
  'media.deleted':                    { label: 'File Deleted',                 category: 'Media' },

  // ── Notification Rules ───────────────────────────────────────────────────
  'notification_rule.updated':        { label: 'Notification Rule Updated',    category: 'Settings' },
  'notification_rules.seeded':        { label: 'Notification Rules Seeded',    category: 'Settings' },
  'notification_rules.bulk_updated':  { label: 'Notification Rules Bulk Updated', category: 'Settings' },

  // ── Orders ───────────────────────────────────────────────────────────────
  'order.status_changed':             { label: 'Order Status Changed',         category: 'Order' },
  'order.note_added':                 { label: 'Order Note Added',             category: 'Order' },
  'order.document_added':             { label: 'Order Document Added',         category: 'Order' },
  'order.soft_deleted':               { label: 'Order Deleted',                category: 'Order' },
  'order.restored':                   { label: 'Order Restored',               category: 'Order' },
  'order.dealer_assigned':            { label: 'Dealer Assigned to Order',     category: 'Order' },

  // ── Payments ─────────────────────────────────────────────────────────────
  'payment.created':                  { label: 'Payment Created',              category: 'Payment' },
  'payment.status_changed':           { label: 'Payment Status Changed',       category: 'Payment' },
  'payment.note_added':               { label: 'Payment Note Added',           category: 'Payment' },
  'payment.deleted':                  { label: 'Payment Deleted',              category: 'Payment' },
  'payment.restored':                 { label: 'Payment Restored',             category: 'Payment' },

  // ── Payment Methods ──────────────────────────────────────────────────────
  'payment_method.created':           { label: 'Payment Method Created',       category: 'Payment' },

  // ── Roles ────────────────────────────────────────────────────────────────
  'role.created':                     { label: 'Role Created',                 category: 'Role' },
  'role.updated':                     { label: 'Role Updated',                 category: 'Role' },
  'role.deleted':                     { label: 'Role Deleted',                 category: 'Role' },
  'role.permissions_assigned':        { label: 'Permissions Assigned to Role', category: 'Role' },

  // ── SEO ──────────────────────────────────────────────────────────────────
  'seo.updated':                      { label: 'SEO Settings Updated',         category: 'Settings' },

  // ── Storage ──────────────────────────────────────────────────────────────
  'storage.updated':                  { label: 'Storage Config Updated',       category: 'Settings' },

  // ── Tax Rates ────────────────────────────────────────────────────────────
  'tax_rate.created':                 { label: 'Tax Rate Created',             category: 'Settings' },
  'tax_rate.updated':                 { label: 'Tax Rate Updated',             category: 'Settings' },
  'tax_rate.deleted':                 { label: 'Tax Rate Deleted',             category: 'Settings' },
  'tax_rate.restored':                { label: 'Tax Rate Restored',            category: 'Settings' },

  // ── Transactions ─────────────────────────────────────────────────────────
  'transaction.created':              { label: 'Transaction Recorded',         category: 'Payment' },
  'transaction.updated':              { label: 'Transaction Updated',          category: 'Payment' },
  'transaction.deleted':              { label: 'Transaction Deleted',          category: 'Payment' },
  'transaction.restored':             { label: 'Transaction Restored',         category: 'Payment' },

  // ── Vehicles ─────────────────────────────────────────────────────────────
  'vehicle.status_changed':           { label: 'Vehicle Status Changed',       category: 'Vehicle' },
  'vehicle.deleted':                  { label: 'Vehicle Deleted',              category: 'Vehicle' },
  'vehicle.restored':                 { label: 'Vehicle Restored',             category: 'Vehicle' },
  'vehicle.bulk_status_changed':      { label: 'Vehicles Bulk Status Changed', category: 'Vehicle' },
  'vehicle.bulk_deleted':             { label: 'Vehicles Bulk Deleted',        category: 'Vehicle' },
  'vehicle.bulk_duplicated':          { label: 'Vehicles Bulk Duplicated',     category: 'Vehicle' },
  'vehicle.bulk_restored':            { label: 'Vehicles Bulk Restored',       category: 'Vehicle' },
};

/** All known entity types (derived from the registry). */
export const ENTITY_TYPES = [
  'company', 'continent', 'country', 'currency', 'email_template',
  'invoice', 'media', 'notification_rule', 'order', 'payment',
  'payment_method', 'role', 'seo', 'storage', 'tax_rate',
  'transaction', 'vehicle',
] as const;

/** Categories for filter grouping. */
export const ACTION_CATEGORIES = [
  'Vehicle', 'Order', 'Payment', 'Role', 'Reference Data', 'Settings', 'Media',
] as const;

/**
 * Resolve an action string to its display label.
 * Falls back to a humanized version of the raw action string if not in the registry.
 */
export function getActionLabel(action: string): string {
  return REGISTRY[action]?.label ?? humanize(action);
}

/** Resolve an action string to its category. */
export function getActionCategory(action: string): string {
  return REGISTRY[action]?.category ?? 'Other';
}

/** Get all action strings for a given category. */
export function getActionsByCategory(category: string): string[] {
  return Object.entries(REGISTRY)
    .filter(([, meta]) => meta.category === category)
    .map(([action]) => action);
}

/** Get all registered action strings. */
export function getAllActions(): string[] {
  return Object.keys(REGISTRY).sort();
}

/** Humanize a raw action string: "vehicle.status_changed" → "Vehicle Status Changed" */
function humanize(action: string): string {
  return action
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
