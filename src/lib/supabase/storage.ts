import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Bucket constants
// ---------------------------------------------------------------------------

export const STORAGE_BUCKETS = {
  vehicles: 'vehicles',
  documents: 'documents',
  media: 'media',
  avatars: 'avatars',
} as const;

export type StorageBucket = keyof typeof STORAGE_BUCKETS;

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

function assertBucket(bucket: string): void {
  if (!bucket || bucket.trim().length === 0) {
    throw new StorageError('Bucket name is required', 'MISSING_BUCKET');
  }
}

function assertPath(path: string): void {
  if (!path || path.trim().length === 0) {
    throw new StorageError('File path is required', 'MISSING_PATH');
  }
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

export function getStorageUrl(bucket: string, path: string): string | null {
  if (!bucket || !path) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!supabaseUrl) return null;

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function getPublicUrl(bucket: string, path: string): string {
  assertBucket(bucket);
  assertPath(path);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadFileOptions {
  contentType?: string;
  upsert?: boolean;
  cacheControl?: string;
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
  assertBucket(bucket);
  assertPath(path);

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
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
  assertBucket(bucket);
  if (paths.length === 0) return;

  const supabase = await createClient();
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
  assertBucket(bucket);
  assertPath(path);

  const supabase = await createClient();
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
  assertBucket(bucket);

  const supabase = await createClient();
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
  assertBucket(bucket);
  assertPath(fromPath);
  assertPath(toPath);

  const supabase = await createClient();
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
  assertBucket(bucket);
  assertPath(fromPath);
  assertPath(toPath);

  const supabase = await createClient();
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
  assertBucket(bucket);
  if (paths.length === 0) return [];

  const supabase = await createClient();
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
