import { createServiceRoleClient } from '@/lib/supabase/service-role';

// ---------------------------------------------------------------------------
// Bucket constants
// ---------------------------------------------------------------------------

export const STORAGE_BUCKETS = {
  vehicles: 'vehicles',
  documents: 'documents',
  media: 'media',
  avatars: 'avatars',
  flags: 'flags',
} as const;

export type StorageBucket = keyof typeof STORAGE_BUCKETS;

// ---------------------------------------------------------------------------
// Bucket allowlists
// ---------------------------------------------------------------------------

export const PUBLIC_BUCKETS: Set<string> = new Set([
  STORAGE_BUCKETS.vehicles,
  STORAGE_BUCKETS.media,
  STORAGE_BUCKETS.avatars,
  STORAGE_BUCKETS.flags,
]);

export const PRIVATE_BUCKETS: Set<string> = new Set([
  STORAGE_BUCKETS.documents,
]);

export const ALLOWED_BUCKETS: Set<string> = new Set([
  ...PUBLIC_BUCKETS,
  ...PRIVATE_BUCKETS,
]);

function assertAllowedBucket(bucket: string): void {
  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new StorageError(`Bucket "${bucket}" is not allowed`, 'DISALLOWED_BUCKET', { bucket });
  }
}

function assertPublicBucket(bucket: string): void {
  assertAllowedBucket(bucket);
  if (!PUBLIC_BUCKETS.has(bucket)) {
    throw new StorageError(`Bucket "${bucket}" is not a public bucket`, 'PRIVATE_BUCKET_PUBLIC_URL', { bucket });
  }
}

function assertPrivateBucket(bucket: string): void {
  assertAllowedBucket(bucket);
  if (!PRIVATE_BUCKETS.has(bucket)) {
    throw new StorageError(`Bucket "${bucket}" is not a private bucket`, 'PUBLIC_BUCKET_PRIVATE_URL', { bucket });
  }
}

// ---------------------------------------------------------------------------
// Typed storage error
// ---------------------------------------------------------------------------

export class StorageError extends Error {
  readonly code: string;
  readonly bucket?: string;
  readonly path?: string;

  constructor(
    message: string,
    code: string,
    options?: { bucket?: string; path?: string; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'StorageError';
    this.code = code;
    this.bucket = options?.bucket;
    this.path = options?.path;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertPath(path: string): void {
  if (!path || path.trim().length === 0) {
    throw new StorageError('File path is required', 'MISSING_PATH');
  }
  // Reject control characters (including NUL) that can corrupt storage keys.
  if (/[\x00-\x1f]/.test(path)) {
    throw new StorageError('File path contains invalid characters', 'INVALID_PATH', { path });
  }
  // Storage keys must be relative — no absolute paths or Windows separators.
  if (path.startsWith('/') || path.includes('\\') || /^[a-zA-Z]:[\\/]/.test(path)) {
    throw new StorageError('File path must be a relative storage key', 'INVALID_PATH', { path });
  }
  // Reject traversal / current-directory segments.
  const segments = path.split('/');
  if (segments.some((segment) => segment === '..' || segment === '.')) {
    throw new StorageError('File path must not contain traversal segments', 'INVALID_PATH', { path });
  }
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

export function getStorageUrl(bucket: string, path: string): string | null {
  if (!bucket || !path) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!supabaseUrl) return null;

  assertAllowedBucket(bucket);

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function getPublicUrl(bucket: string, path: string): string {
  assertPublicBucket(bucket);
  assertPath(path);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function getPrivateUrl(bucket: string, path: string): string {
  assertPrivateBucket(bucket);
  assertPath(path);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;
}

function assertBucketAndAllowed(bucket: string): void {
  assertAllowedBucket(bucket);
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  'image/svg+xml',
  'image/png',
  'image/webp',
  'image/jpeg',
  'image/gif',
  'application/pdf',
  'text/csv',
  'application/json',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB default

export interface UploadFileOptions {
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
  allowedMimeTypes?: Set<string>;
  maxFileSize?: number;
}

export interface UploadFileResult {
  path: string;
  id: string;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer | ArrayBuffer,
  options?: UploadFileOptions,
): Promise<UploadFileResult> {
  assertAllowedBucket(bucket);
  assertPath(path);

  // Validate file size
  const maxSize = options?.maxFileSize ?? MAX_FILE_SIZE;
  const fileSize = file instanceof File ? file.size : file.byteLength;
  if (fileSize > maxSize) {
    throw new StorageError(
      `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`,
      'FILE_TOO_LARGE',
      { bucket, path },
    );
  }

  // Validate MIME type if content type is provided
  const contentType = options?.contentType ?? (file instanceof File ? file.type : undefined);
  const allowedTypes = options?.allowedMimeTypes ?? ALLOWED_MIME_TYPES;
  if (contentType && !allowedTypes.has(contentType)) {
    throw new StorageError(
      `File type "${contentType}" is not allowed. Allowed types: ${Array.from(allowedTypes).join(', ')}`,
      'INVALID_FILE_TYPE',
      { bucket, path },
    );
  }

  // Phase 8 defence-in-depth: SVG is a public-bucket format only (upload
  // categories never permit it for private documents — this guard closes any
  // future low-level bypass for the private documents bucket).
  if (contentType === 'image/svg+xml' && PRIVATE_BUCKETS.has(bucket)) {
    throw new StorageError(
      'SVG uploads are not allowed in private buckets',
      'SVG_PRIVATE_BUCKET_FORBIDDEN',
      { bucket, path },
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType,
      upsert: options?.upsert ?? false,
      cacheControl: options?.cacheControl ?? '3600',
    });

  if (error) {
    throw new StorageError(error.message, 'UPLOAD_FAILED', {
      bucket,
      path,
      cause: error,
    });
  }

  return { path: data.path, id: data.id };
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteFile(
  bucket: string,
  paths: string[],
): Promise<void> {
  assertAllowedBucket(bucket);
  if (paths.length === 0) return;

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(bucket).remove(paths);

  if (error) {
    throw new StorageError(error.message, 'DELETE_FAILED', { bucket });
  }
}

// ---------------------------------------------------------------------------
// Signed URL (single)
// ---------------------------------------------------------------------------

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600,
): Promise<string> {
  assertAllowedBucket(bucket);
  assertPath(path);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new StorageError(error.message, 'SIGNED_URL_FAILED', {
      bucket,
      path,
      cause: error,
    });
  }

  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// List files
// ---------------------------------------------------------------------------

export interface ListFilesOptions {
  prefix?: string;
  limit?: number;
  offset?: number;
  sortBy?: { column: string; order: 'asc' | 'desc' };
}

export interface StorageFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

export async function listFiles(
  bucket: string,
  prefix?: string,
  limit: number = 100,
  options?: Omit<ListFilesOptions, 'prefix' | 'limit'>,
): Promise<StorageFile[]> {
  assertAllowedBucket(bucket);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit,
    offset: options?.offset,
    sortBy: options?.sortBy,
  });

  if (error) {
    throw new StorageError(error.message, 'LIST_FAILED', { bucket });
  }

  return data as StorageFile[];
}

// ---------------------------------------------------------------------------
// Move
// ---------------------------------------------------------------------------

export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string,
): Promise<void> {
  assertAllowedBucket(bucket);
  assertPath(fromPath);
  assertPath(toPath);

  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage
    .from(bucket)
    .move(fromPath, toPath);

  if (error) {
    throw new StorageError(error.message, 'MOVE_FAILED', {
      bucket,
      path: fromPath,
      cause: error,
    });
  }
}

// ---------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------

export interface CopyFileResult {
  path: string;
}

export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string,
): Promise<CopyFileResult> {
  assertAllowedBucket(bucket);
  assertPath(fromPath);
  assertPath(toPath);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .copy(fromPath, toPath);

  if (error) {
    throw new StorageError(error.message, 'COPY_FAILED', {
      bucket,
      path: fromPath,
      cause: error,
    });
  }

  return { path: data.path };
}

// ---------------------------------------------------------------------------
// Batch signed URLs
// ---------------------------------------------------------------------------

export interface SignedUrlEntry {
  path: string;
  signedUrl: string;
}

export async function createSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn: number = 3600,
): Promise<SignedUrlEntry[]> {
  assertAllowedBucket(bucket);
  if (paths.length === 0) return [];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresIn);

  if (error) {
    throw new StorageError(error.message, 'BATCH_SIGNED_URL_FAILED', {
      bucket,
      cause: error,
    });
  }

  return paths.map((path, i) => ({
    path,
    signedUrl: data[i]?.signedUrl ?? '',
  }));
}
