/**
 * Application-wide constants.
 * Never hardcode these values elsewhere in the codebase.
 */

/** Default pagination page size */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum pagination page size */
export const MAX_PAGE_SIZE = 100;

/** Currency rate cache duration in seconds (30 minutes per NFR-PERF-008) */
export const CURRENCY_CACHE_SECONDS = 1800;

/** Country data cache duration in seconds (24 hours per NFR-PERF-009) */
export const COUNTRY_CACHE_SECONDS = 86400;

/** Maximum file upload size in bytes (20 MB per NFR) */
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** Allowed document MIME types */
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'] as const;

/** API base path */
export const API_BASE_PATH = '/api' as const;

/** Supported user roles */
export const USER_ROLES = [
  'customer',
  'dealer',
  'admin',
  'super_admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];
