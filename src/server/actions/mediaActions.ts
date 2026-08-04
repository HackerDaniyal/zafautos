'use server';

import { requireAuth } from '@/lib/auth';
import {
  listFiles,
  deleteFile,
  getSignedUrl,
  getPublicUrl,
  type StorageFile,
} from '@/lib/supabase/storage';
import { handleError, type ActionResult } from '@/lib/errors/action-error';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListMediaParams {
  bucket: string;
  prefix?: string;
  limit?: number;
  offset?: number;
}

interface MediaFileItem {
  id: string;
  name: string;
  path: string;
  bucket: string;
  size: number;
  type: string;
  url: string;
  created_at: string | null;
  updated_at: string | null;
}

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

    const { bucket, prefix, limit = 50, offset = 0 } = params;

    if (!bucket) {
      return { success: false, error: 'Bucket is required', code: 'VALIDATION_ERROR' };
    }

    const files = await listFiles(bucket, prefix, limit, {
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
    });

    const items = files.map((file) =>
      mapStorageFileToMediaItem(file, bucket, prefix),
    );

    return { success: true, data: items };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteMedia(
  bucket: string,
  path: string,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();

    if (!bucket || !path) {
      return {
        success: false,
        error: 'Bucket and path are required',
        code: 'VALIDATION_ERROR',
      };
    }

    await deleteFile(bucket, [path]);
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
