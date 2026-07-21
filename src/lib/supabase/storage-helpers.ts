import { ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES } from '@/lib/constants';

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

export type AllowedMimeTypes =
  | (typeof ALLOWED_IMAGE_TYPES)[number]
  | (typeof ALLOWED_DOCUMENT_TYPES)[number];

export interface FileValidationError {
  valid: false;
  reason: string;
  code: string;
}

export interface FileValidationSuccess {
  valid: true;
}

export type FileValidationResult = FileValidationError | FileValidationSuccess;

/**
 * Validate a file's MIME type against a list of allowed types.
 */
export function validateFileType(
  file: File,
  allowedTypes: readonly string[],
): FileValidationResult {
  if (!file?.type) {
    return {
      valid: false,
      reason: 'Unable to determine file type',
      code: 'UNKNOWN_TYPE',
    };
  }

  const isAllowed = allowedTypes.some(
    (t) => t === file.type || file.type.startsWith(t.replace('*', '')),
  );

  if (!isAllowed) {
    return {
      valid: false,
      reason: `File type "${file.type}" is not allowed. Allowed: ${allowedTypes.join(', ')}`,
      code: 'INVALID_TYPE',
    };
  }

  return { valid: true };
}

/**
 * Validate a file's size against a maximum in MB.
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number,
): FileValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      reason: `File size ${(file.size / 1024 / 1024).toFixed(2)} MB exceeds maximum ${maxSizeMB} MB`,
      code: 'FILE_TOO_LARGE',
    };
  }

  return { valid: true };
}

// ---------------------------------------------------------------------------
// Image dimensions (client-side via canvas)
// ---------------------------------------------------------------------------

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Get image dimensions using a canvas element.
 * This is a client-side only utility — it will throw in server / edge runtimes.
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(
        new Error('getImageDimensions is a client-side only utility'),
      );
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for dimension check'));
    };

    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Storage path generation
// ---------------------------------------------------------------------------

/**
 * Generate an organised storage path like `vehicles/{id}/images/{uuid}.{ext}`.
 */
export function generateStoragePath(
  entityType: string,
  entityId: string,
  filename: string,
): string {
  const ext = getFileExtension(filename);
  const uuid = crypto.randomUUID();
  const sanitisedEntity = entityType.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
  const sanitisedId = entityId.replace(/[^a-zA-Z0-9_-]/g, '');

  return `${sanitisedEntity}/${sanitisedId}/${uuid}.${ext}`;
}

// ---------------------------------------------------------------------------
// File extension extraction
// ---------------------------------------------------------------------------

/**
 * Extract the lowercase file extension from a filename, without the leading dot.
 * Returns `''` if no extension is found.
 */
export function getFileExtension(filename: string): string {
  if (!filename || !filename.includes('.')) return '';

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';

  return filename.slice(lastDot + 1).toLowerCase();
}
