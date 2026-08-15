'use server';

import { requireAuth } from '@/lib/auth';
import {
  listFiles,
  deleteFile,
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  STORAGE_BUCKETS,
  type StorageFile,
  type StorageBucket,
} from '@/lib/supabase/storage';
import { validateFileType, validateFileSize, getFileExtension } from '@/lib/supabase/storage-helpers';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';

const auditService = new AuditService();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListMediaParams {
  bucket: string;
  prefix?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface UploadMediaParams {
  bucket: string;
  prefix?: string;
}

interface MediaFileItem {
  id: string;
  name: string;
  path: string;
  bucket: string;
  size: number;
  type: string;
  url: string
  created_at: string | null;
  updated_at: string | null;
}

export interface BucketConfig {
  name: string;
  label: string;
  allowedTypes: string[];
  maxSizeMB: number;
  publicAccess: boolean;
}

// ---------------------------------------------------------------------------
// Bucket configuration
// ---------------------------------------------------------------------------

const BUCKET_CONFIGS: Record<string, BucketConfig> = {
  [STORAGE_BUCKETS.vehicles]: {
    name: STORAGE_BUCKETS.vehicles,
    label: 'Vehicles',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 10,
    publicAccess: true,
  },
  [STORAGE_BUCKETS.documents]: {
    name: STORAGE_BUCKETS.documents,
    label: 'Documents',
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 20,
    publicAccess: false,
  },
  [STORAGE_BUCKETS.media]: {
    name: STORAGE_BUCKETS.media,
    label: 'Media',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'video/mp4'],
    maxSizeMB: 10,
    publicAccess: true,
  },
  [STORAGE_BUCKETS.avatars]: {
    name: STORAGE_BUCKETS.avatars,
    label: 'Avatars',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMB: 5,
    publicAccess: true,
  },
  [STORAGE_BUCKETS.flags]: {
    name: STORAGE_BUCKETS.flags,
    label: 'Flags',
    allowedTypes: ['image/svg+xml', 'image/png', 'image/webp'],
    maxSizeMB: 2,
    publicAccess: true,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFileMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    zip: 'application/zip',
  };
  return mimeMap[ext] ?? 'application/octet-stream';
}

function mapStorageFileToMediaItem(
  file: StorageFile,
  bucket: string,
  prefix?: string,
): MediaFileItem {
  const path = prefix ? `${prefix}/${file.name}` : file.name;
  return {
    id: file.id ?? path,
    name: file.name,
    path,
    bucket,
    size: typeof file.metadata?.size === 'number' ? file.metadata.size : 0,
    type:
      typeof file.metadata?.mimetype === 'string'
        ? file.metadata.mimetype
        : getFileMimeType(file.name),
    url: getPublicUrl(bucket, path),
    created_at: file.created_at,
    updated_at: file.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function listMedia(params: ListMediaParams): Promise<ActionResult<MediaFileItem[]>> {
  try {
    await requireAuth();

    const { bucket, prefix, search, limit = 50, offset = 0 } = params;

    if (!bucket) {
      return { success: false, error: 'Bucket is required', code: 'VALIDATION_ERROR' };
    }

    let files = await listFiles(bucket, prefix, limit + 1, {
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    if (search) {
      const q = search.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }

    const items = files.map((file) =>
      mapStorageFileToMediaItem(file, bucket, prefix),
    );

    return { success: true, data: items };
  } catch (error) {
    return handleError(error);
  }
}

export async function getBucketConfigs(): Promise<ActionResult<BucketConfig[]>> {
  try {
    await requireAuth();
    return { success: true, data: Object.values(BUCKET_CONFIGS) };
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadMedia(
  params: UploadMediaParams,
  formData: FormData,
): Promise<ActionResult<MediaFileItem[]>> {
  try {
    const auth = await requireAuth();

    const { bucket, prefix } = params;
    if (!bucket) {
      return { success: false, error: 'Bucket is required', code: 'VALIDATION_ERROR' };
    }

    const config = BUCKET_CONFIGS[bucket];
    if (!config) {
      return { success: false, error: `Unknown bucket: ${bucket}`, code: 'VALIDATION_ERROR' };
    }

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided', code: 'VALIDATION_ERROR' };
    }

    const maxSizeBytes = config.maxSizeMB * 1024 * 1024;
    const uploaded: MediaFileItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      const typeResult = validateFileType(file, config.allowedTypes);
      if (!typeResult.valid) {
        errors.push(`${file.name}: ${typeResult.reason}`);
        continue;
      }

      const sizeResult = validateFileSize(file, config.maxSizeMB);
      if (!sizeResult.valid) {
        errors.push(`${file.name}: ${sizeResult.reason}`);
        continue;
      }

      const ext = getFileExtension(file.name);
      const filePath = prefix
        ? `${prefix}/${crypto.randomUUID()}.${ext}`
        : `${crypto.randomUUID()}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(bucket, filePath, buffer, {
        contentType: file.type,
      });

      const item: MediaFileItem = {
        id: result.id,
        name: file.name,
        path: result.path,
        bucket,
        size: file.size,
        type: file.type,
        url: getPublicUrl(bucket, result.path),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      uploaded.push(item);
    }

    if (uploaded.length > 0) {
      await auditService.logAction({
        action: 'media.uploaded',
        entityType: 'media',
        entityId: uploaded.map((f) => f.id).join(','),
        entityLabel: `${uploaded.length} file(s) to ${bucket}`,
        metadata: { bucket, fileCount: uploaded.length, fileNames: uploaded.map((f) => f.name) },
      });
    }

    if (errors.length > 0 && uploaded.length === 0) {
      return { success: false, error: errors.join('; '), code: 'VALIDATION_ERROR' };
    }

    return { success: true, data: uploaded };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteMedia(
  bucket: string,
  path: string,
): Promise<ActionResult<void>> {
  try {
    const auth = await requireAuth();

    if (!bucket || !path) {
      return {
        success: false,
        error: 'Bucket and path are required',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteFile(bucket, [path]);

    await auditService.logAction({
      action: 'media.deleted',
      entityType: 'media',
      entityId: path,
      entityLabel: path.split('/').pop() ?? path,
      metadata: { bucket, path },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function getMediaUrl(
  bucket: string,
  path: string,
): Promise<ActionResult<string>> {
  try {
    await requireAuth();

    if (!bucket || !path) {
      return {
        success: false,
        error: 'Bucket and path are required',
        code: 'VALIDATION_ERROR',
      };
    }

    const url = await getSignedUrl(bucket, path, 3600);
    return { success: true, data: url };
  } catch (error) {
    return handleError(error);
  }
}
