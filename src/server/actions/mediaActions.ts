'use server';

import { requireAuth } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/rbac';
import {
  listFiles,
  deleteFile,
  uploadFile,
  getSignedUrl,
  getPublicUrl,
  STORAGE_BUCKETS,
  type StorageFile,
} from '@/lib/supabase/storage';
import { validateUploadFile, UPLOAD_CATEGORIES } from '@/lib/supabase/upload-validation';
import { handleError, type ActionResult } from '@/lib/errors/action-error';
import { AuditService } from '@/server/services/auditService';
import { enforceFileUploadRateLimit } from '@/lib/api/rateLimiter';
import { db } from '@/server/db/client';
import { vehicleImages } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const auditService = new AuditService();

const CMS_BUCKET = STORAGE_BUCKETS.media;
const VEHICLE_BUCKET = STORAGE_BUCKETS.vehicles;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

const CMS_BUCKET_CONFIG: BucketConfig = {
  name: CMS_BUCKET,
  label: 'Media',
  allowedTypes: [...UPLOAD_CATEGORIES.cmsMedia.allowedTypes],
  maxSizeMB: UPLOAD_CATEGORIES.cmsMedia.maxBytes / (1024 * 1024),
  publicAccess: true,
};

const VEHICLE_BUCKET_CONFIG: BucketConfig = {
  name: VEHICLE_BUCKET,
  label: 'Vehicles',
  allowedTypes: [...UPLOAD_CATEGORIES.vehicleImages.allowedTypes],
  maxSizeMB: UPLOAD_CATEGORIES.vehicleImages.maxBytes / (1024 * 1024),
  publicAccess: true,
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
): MediaFileItem {
  return {
    id: file.id ?? file.name,
    name: file.name,
    path: file.name,
    bucket,
    size: typeof file.metadata?.size === 'number' ? file.metadata.size : 0,
    type:
      typeof file.metadata?.mimetype === 'string'
        ? file.metadata.mimetype
        : getFileMimeType(file.name),
    url: getPublicUrl(bucket, file.name),
    created_at: file.created_at,
    updated_at: file.updated_at,
  };
}

async function verifyVehicleImagePath(path: string): Promise<boolean> {
  try {
    const image = await db.select().from(vehicleImages).where(eq(vehicleImages.imageUrl, path)).limit(1);
    if (image && image.length > 0) return true;
    const fullPath = `vehicles/${path}`;
    const imageByFullPath = await db.select().from(vehicleImages).where(eq(vehicleImages.imageUrl, fullPath)).limit(1);
    return imageByFullPath && imageByFullPath.length > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function listMedia(): Promise<ActionResult<MediaFileItem[]>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');

    const files = await listFiles(CMS_BUCKET, undefined, 50, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

    const items = files.map((file) => mapStorageFileToMediaItem(file, CMS_BUCKET));

    return { success: true, data: items };
  } catch (error) {
    return handleError(error);
  }
}

export async function listVehicleMedia(): Promise<ActionResult<MediaFileItem[]>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');

    const files = await listFiles(VEHICLE_BUCKET, undefined, 50, {
      sortBy: { column: 'created_at', order: 'desc' },
    });

    const items = files.map((file) => mapStorageFileToMediaItem(file, VEHICLE_BUCKET));

    return { success: true, data: items };
  } catch (error) {
    return handleError(error);
  }
}

export async function getBucketConfigs(): Promise<ActionResult<BucketConfig[]>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');
    return { success: true, data: [CMS_BUCKET_CONFIG, VEHICLE_BUCKET_CONFIG] };
  } catch (error) {
    return handleError(error);
  }
}

export async function uploadMedia(
  formData: FormData,
): Promise<ActionResult<MediaFileItem[]>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    try {
      await enforceFileUploadRateLimit(auth.userId);
    } catch {
      return { success: false, error: 'Too many uploads. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' };
    }

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided', code: 'VALIDATION_ERROR' };
    }

    const config = CMS_BUCKET_CONFIG;
    const uploaded: MediaFileItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      const validation = await validateUploadFile(file, 'cmsMedia');
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.reason}`);
        continue;
      }

      const filePath = `${crypto.randomUUID()}.${validation.safeExtension}`;
      const result = await uploadFile(CMS_BUCKET, filePath, validation.buffer, {
        contentType: validation.claimedType,
        maxFileSize: config.maxSizeMB * 1024 * 1024,
        upsert: false,
      });

      const item: MediaFileItem = {
        id: result.id,
        name: file.name,
        path: result.path,
        bucket: CMS_BUCKET,
        size: file.size,
        type: file.type,
        url: getPublicUrl(CMS_BUCKET, result.path),
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
        entityLabel: `${uploaded.length} file(s) to ${CMS_BUCKET}`,
        metadata: { bucket: CMS_BUCKET, fileCount: uploaded.length, fileNames: uploaded.map((f) => f.name) },
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

export async function uploadVehicleMedia(
  formData: FormData,
): Promise<ActionResult<MediaFileItem[]>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.update');
    try {
      await enforceFileUploadRateLimit(auth.userId);
    } catch {
      return { success: false, error: 'Too many uploads. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' };
    }

    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return { success: false, error: 'No files provided', code: 'VALIDATION_ERROR' };
    }

    const config = VEHICLE_BUCKET_CONFIG;
    const uploaded: MediaFileItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      const validation = await validateUploadFile(file, 'vehicleImages');
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.reason}`);
        continue;
      }

      const filePath = `${crypto.randomUUID()}.${validation.safeExtension}`;
      const result = await uploadFile(VEHICLE_BUCKET, filePath, validation.buffer, {
        contentType: validation.claimedType,
        maxFileSize: config.maxSizeMB * 1024 * 1024,
        upsert: false,
      });

      const item: MediaFileItem = {
        id: result.id,
        name: file.name,
        path: result.path,
        bucket: VEHICLE_BUCKET,
        size: file.size,
        type: file.type,
        url: getPublicUrl(VEHICLE_BUCKET, result.path),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      uploaded.push(item);
    }

    if (uploaded.length > 0) {
      await auditService.logAction({
        action: 'vehicle_media.uploaded',
        entityType: 'vehicle_media',
        entityId: uploaded.map((f) => f.id).join(','),
        entityLabel: `${uploaded.length} file(s) to ${VEHICLE_BUCKET}`,
        metadata: { bucket: VEHICLE_BUCKET, fileCount: uploaded.length, fileNames: uploaded.map((f) => f.name) },
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

export async function deleteMedia(path: string): Promise<ActionResult<void>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.delete');

    if (!path) {
      return {
        success: false,
        error: 'Path is required',
        code: 'VALIDATION_ERROR',
      };
    }

    const verified = await verifyVehicleImagePath(path);
    if (!verified) {
      return { success: false, error: 'Unauthorized: image not associated with a vehicle', code: 'UNAUTHORIZED' };
    }

    await deleteFile(VEHICLE_BUCKET, [path]);

    await auditService.logAction({
      action: 'media.deleted',
      entityType: 'media',
      entityId: path,
      entityLabel: path.split('/').pop() ?? path,
      metadata: { bucket: VEHICLE_BUCKET, path },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return handleError(error);
  }
}

export async function getMediaUrl(path: string): Promise<ActionResult<string>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'vehicles.read');

    if (!path) {
      return {
        success: false,
        error: 'Path is required',
        code: 'VALIDATION_ERROR',
      };
    }

    const verified = await verifyVehicleImagePath(path);
    if (!verified) {
      return { success: false, error: 'Unauthorized: image not associated with a vehicle', code: 'UNAUTHORIZED' };
    }

    const url = await getSignedUrl(VEHICLE_BUCKET, path, 3600);
    return { success: true, data: url };
  } catch (error) {
    return handleError(error);
  }
}

export async function getDocumentSignedUrl(documentId: string): Promise<ActionResult<string>> {
  try {
    const auth = await requireAuth();
    await requirePermission(auth, 'documents.read');

    if (!documentId) {
      return {
        success: false,
        error: 'Document ID is required',
        code: 'VALIDATION_ERROR',
      };
    }

    const { DocumentService } = await import('@/server/services');
    const service = new DocumentService();
    const document = await service.getDocument(documentId);

    if (!document || typeof document !== 'object' || !('documentUrl' in document)) {
      return { success: false, error: 'Document not found', code: 'NOT_FOUND' };
    }

    const doc = document as { documentUrl: string };
    const url = doc.documentUrl;

    if (url.startsWith('/storage/v1/object/public/documents/')) {
      const path = url.replace('/storage/v1/object/public/documents/', '');
      const signedUrl = await getSignedUrl(STORAGE_BUCKETS.documents, path, 3600);
      return { success: true, data: signedUrl };
    }

    return { success: true, data: url };
  } catch (error) {
    return handleError(error);
  }
}
