import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Mocks — service-role client for uploadFile() tests
// ---------------------------------------------------------------------------

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi
    .fn()
    .mockResolvedValue({ data: { path: 'test/path', id: 'test-id' }, error: null }),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.test' } }),
        createSignedUrls: vi.fn().mockResolvedValue({ data: [{ signedUrl: 'https://signed.test' }] }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        move: vi.fn().mockResolvedValue({ data: null, error: null }),
        copy: vi.fn().mockResolvedValue({ data: { path: 'test/path' } }),
      })),
    },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

const { validateUploadFile, detectFileType, UPLOAD_CATEGORIES } = await import(
  '@/lib/supabase/upload-validation'
);
const { uploadFile, StorageError } = await import('@/lib/supabase/storage');

// ---------------------------------------------------------------------------
// Fixtures — real file-signature byte sequences
// ---------------------------------------------------------------------------

const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const GIF_BYTES = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
const WEBP_BYTES = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x20,
]);
const PDF_BYTES = Buffer.from('%PDF-1.4\n1 0 obj\n<< >>\nendobj\n');
const MP4_BYTES = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x6d, 0x70, 0x34, 0x32,
]);
const OLE_BYTES = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00]);
const ZIP_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
const EXE_BYTES = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
const HTML_BYTES = Buffer.from(
  '<!DOCTYPE html>\n<html><head><title>x</title></head><body>hi</body></html>',
);
const SVG_BYTES = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>',
);
const SVG_XML_BYTES = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><svg></svg>');
const CSV_BYTES = Buffer.from('name,value\nalpha,1\nbeta,2\n');

function file(bytes: Uint8Array | Buffer, name: string, type: string): File {
  return new File([bytes as unknown as BlobPart], name, { type });
}

function readSrc(relativePath: string): string {
  return readFileSync(join(process.cwd(), 'src', relativePath), 'utf8');
}

// ---------------------------------------------------------------------------
// detectFileType — magic-byte inspection
// ---------------------------------------------------------------------------

describe('detectFileType()', () => {
  it('detects JPEG from FF D8 FF signature', () => {
    expect(detectFileType(JPEG_BYTES)).toBe('image/jpeg');
  });

  it('detects PNG from 89 50 4E 47 signature', () => {
    expect(detectFileType(PNG_BYTES)).toBe('image/png');
  });

  it('detects GIF from GIF8 signature', () => {
    expect(detectFileType(GIF_BYTES)).toBe('image/gif');
  });

  it('detects WEBP from RIFF....WEBP signature', () => {
    expect(detectFileType(WEBP_BYTES)).toBe('image/webp');
  });

  it('detects PDF from %PDF signature', () => {
    expect(detectFileType(PDF_BYTES)).toBe('application/pdf');
  });

  it('detects MP4 from ftyp box', () => {
    expect(detectFileType(MP4_BYTES)).toBe('video/mp4');
  });

  it('detects legacy Office OLE compound documents', () => {
    expect(detectFileType(OLE_BYTES)).toBe('application/x-ole-storage');
  });

  it('detects ZIP containers (docx/xlsx)', () => {
    expect(detectFileType(ZIP_BYTES)).toBe('application/zip');
  });

  it('detects SVG text content', () => {
    expect(detectFileType(SVG_BYTES)).toBe('image/svg+xml');
  });

  it('detects XML-declared SVG text content', () => {
    expect(detectFileType(SVG_XML_BYTES)).toBe('image/svg+xml');
  });

  it('classifies plain text (CSV) as text/plain', () => {
    expect(detectFileType(CSV_BYTES)).toBe('text/plain');
  });

  it('returns null for executable binary content (NUL bytes, unknown signature)', () => {
    expect(detectFileType(EXE_BYTES)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// A. MIME spoofing — client file.type must agree with real content
// ---------------------------------------------------------------------------

describe('validateUploadFile() — MIME spoofing', () => {
  it('rejects HTML content declared as image/jpeg with a .jpg filename', async () => {
    const result = await validateUploadFile(
      file(HTML_BYTES, 'photo.jpg', 'image/jpeg'),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('CONTENT_MISMATCH');
  });

  it('rejects PDF content declared as image/jpeg with a .jpg filename', async () => {
    const result = await validateUploadFile(
      file(PDF_BYTES, 'photo.jpg', 'image/jpeg'),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('CONTENT_MISMATCH');
  });

  it('rejects executable content declared as image/png', async () => {
    const result = await validateUploadFile(
      file(EXE_BYTES, 'photo.png', 'image/png'),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNDETECTABLE_CONTENT');
  });

  it('rejects PNG content declared as application/pdf', async () => {
    const result = await validateUploadFile(
      file(PNG_BYTES, 'report.pdf', 'application/pdf'),
      'adminDocuments',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('CONTENT_MISMATCH');
  });

  it('rejects a file whose declared type is not in the category allowlist', async () => {
    const result = await validateUploadFile(
      file(PDF_BYTES, 'report.pdf', 'application/pdf'),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('INVALID_TYPE');
  });
});

// ---------------------------------------------------------------------------
// B/C. Extension spoofing and unsupported extensions
// ---------------------------------------------------------------------------

describe('validateUploadFile() — extension validation', () => {
  it('rejects a PDF renamed to .jpg (extension disagrees with validated type)', async () => {
    const result = await validateUploadFile(
      file(PDF_BYTES, 'photo.jpg', 'application/pdf'),
      'adminDocuments',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EXTENSION_MISMATCH');
  });

  it('rejects an executable extension (.exe) even when content is a valid image', async () => {
    const result = await validateUploadFile(
      file(JPEG_BYTES, 'malware.exe', 'image/jpeg'),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EXTENSION_MISMATCH');
  });

  it('rejects a filename with no extension', async () => {
    const result = await validateUploadFile(
      file(PDF_BYTES, 'readme', 'application/pdf'),
      'adminDocuments',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EXTENSION_MISMATCH');
  });

  it('rejects a double extension ending in .exe', async () => {
    const result = await validateUploadFile(
      file(JPEG_BYTES, 'invoice.jpg.exe', 'image/jpeg'),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EXTENSION_MISMATCH');
  });

  it('accepts .jpeg as a valid extension for image/jpeg', async () => {
    const result = await validateUploadFile(
      file(JPEG_BYTES, 'photo.jpeg', 'image/jpeg'),
      'vehicleImages',
    );
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.safeExtension).toBe('jpeg');
  });
});

// ---------------------------------------------------------------------------
// D. Oversized files
// ---------------------------------------------------------------------------

describe('validateUploadFile() — size limits', () => {
  it('rejects a file larger than the category limit before reading it', async () => {
    const oversized = new File(
      [Buffer.alloc(UPLOAD_CATEGORIES.vehicleImages.maxBytes + 1)],
      'big.jpg',
      { type: 'image/jpeg' },
    );
    const result = await validateUploadFile(oversized, 'vehicleImages');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('FILE_TOO_LARGE');
  });
});

// ---------------------------------------------------------------------------
// E/F. Valid files accepted per existing business rules
// ---------------------------------------------------------------------------

describe('validateUploadFile() — valid uploads', () => {
  it('accepts a valid JPEG for vehicle images', async () => {
    const result = await validateUploadFile(
      file(JPEG_BYTES, 'car.jpg', 'image/jpeg'),
      'vehicleImages',
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.safeExtension).toBe('jpg');
      expect(result.detectedType).toBe('image/jpeg');
      expect(result.buffer.equals(JPEG_BYTES)).toBe(true);
    }
  });

  it('accepts a valid PNG for vehicle images', async () => {
    const result = await validateUploadFile(
      file(PNG_BYTES, 'car.png', 'image/png'),
      'vehicleImages',
    );
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.safeExtension).toBe('png');
  });

  it('accepts a valid WEBP for vehicle images', async () => {
    const result = await validateUploadFile(
      file(WEBP_BYTES, 'car.webp', 'image/webp'),
      'vehicleImages',
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a valid PDF for admin documents', async () => {
    const result = await validateUploadFile(
      file(PDF_BYTES, 'invoice.pdf', 'application/pdf'),
      'adminDocuments',
    );
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.safeExtension).toBe('pdf');
  });

  it('accepts a valid PDF for vehicle documents', async () => {
    const result = await validateUploadFile(
      file(PDF_BYTES, 'registration.pdf', 'application/pdf'),
      'vehicleDocuments',
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a valid GIF for CMS media', async () => {
    const result = await validateUploadFile(
      file(GIF_BYTES, 'banner.gif', 'image/gif'),
      'cmsMedia',
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a valid SVG for CMS media', async () => {
    const result = await validateUploadFile(
      file(SVG_BYTES, 'logo.svg', 'image/svg+xml'),
      'cmsMedia',
    );
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.detectedType).toBe('image/svg+xml');
  });

  it('accepts a valid MP4 for CMS media', async () => {
    const result = await validateUploadFile(
      file(MP4_BYTES, 'clip.mp4', 'video/mp4'),
      'cmsMedia',
    );
    expect(result.valid).toBe(true);
  });

  it('accepts CSV content for order documents', async () => {
    const result = await validateUploadFile(
      file(CSV_BYTES, 'manifest.csv', 'text/csv'),
      'orderDocuments',
    );
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.safeExtension).toBe('csv');
  });

  it('accepts a ZIP-based DOCX for order documents', async () => {
    const result = await validateUploadFile(
      file(ZIP_BYTES, 'contract.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      'orderDocuments',
    );
    expect(result.valid).toBe(true);
    if (result.valid) expect(result.safeExtension).toBe('docx');
  });

  it('accepts an OLE-based legacy .doc for order documents', async () => {
    const result = await validateUploadFile(
      file(OLE_BYTES, 'contract.doc', 'application/msword'),
      'orderDocuments',
    );
    expect(result.valid).toBe(true);
  });

  it('accepts a ZIP-based XLSX for order documents', async () => {
    const result = await validateUploadFile(
      file(ZIP_BYTES, 'sheet.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
      'orderDocuments',
    );
    expect(result.valid).toBe(true);
  });

  it('accepts an OLE-based legacy .xls for order documents', async () => {
    const result = await validateUploadFile(
      file(OLE_BYTES, 'sheet.xls', 'application/vnd.ms-excel'),
      'orderDocuments',
    );
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Missing type / empty file / category configuration
// ---------------------------------------------------------------------------

describe('validateUploadFile() — edge cases', () => {
  it('rejects a file with no declared MIME type', async () => {
    const result = await validateUploadFile(
      file(JPEG_BYTES, 'photo.jpg', ''),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('MISSING_CONTENT_TYPE');
  });

  it('rejects an empty file', async () => {
    const result = await validateUploadFile(
      new File([], 'photo.jpg', { type: 'image/jpeg' }),
      'vehicleImages',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EMPTY_FILE');
  });
});

describe('UPLOAD_CATEGORIES', () => {
  it('defines exactly the five existing upload categories', () => {
    expect(Object.keys(UPLOAD_CATEGORIES).sort()).toEqual([
      'adminDocuments',
      'cmsMedia',
      'orderDocuments',
      'vehicleDocuments',
      'vehicleImages',
    ]);
  });

  it('vehicle documents allow 20MB per the documents bucket business rule', () => {
    expect(UPLOAD_CATEGORIES.vehicleDocuments.maxBytes).toBe(20 * 1024 * 1024);
  });

  it('vehicle images allow only jpeg/png/webp at 10MB', () => {
    expect(UPLOAD_CATEGORIES.vehicleImages.allowedTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]);
    expect(UPLOAD_CATEGORIES.vehicleImages.maxBytes).toBe(10 * 1024 * 1024);
  });

  it('order documents retain the existing office-document formats', () => {
    expect(UPLOAD_CATEGORIES.orderDocuments.allowedTypes).toContain('application/pdf');
    expect(UPLOAD_CATEGORIES.orderDocuments.allowedTypes).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    expect(UPLOAD_CATEGORIES.orderDocuments.allowedTypes).toContain('text/csv');
    expect(UPLOAD_CATEGORIES.orderDocuments.maxBytes).toBe(20 * 1024 * 1024);
  });

  it('CMS media retains gif/svg/mp4', () => {
    expect(UPLOAD_CATEGORIES.cmsMedia.allowedTypes).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
    ]);
  });
});

// ---------------------------------------------------------------------------
// H. Path traversal / storage path safety
// ---------------------------------------------------------------------------

describe('uploadFile() — storage path safety', () => {
  it('rejects a path containing a .. traversal segment', async () => {
    await expect(
      uploadFile('vehicles', '../evil.jpg', Buffer.from('x')),
    ).rejects.toMatchObject({ code: 'INVALID_PATH' });
  });

  it('rejects a path with an embedded .. segment', async () => {
    await expect(
      uploadFile('vehicles', 'orders/../../etc/passwd', Buffer.from('x')),
    ).rejects.toMatchObject({ code: 'INVALID_PATH' });
  });

  it('rejects an absolute path', async () => {
    await expect(
      uploadFile('vehicles', '/etc/passwd', Buffer.from('x')),
    ).rejects.toMatchObject({ code: 'INVALID_PATH' });
  });

  it('rejects a path containing NUL / control characters', async () => {
    await expect(
      uploadFile('vehicles', 'image\u0000.jpg', Buffer.from('x')),
    ).rejects.toMatchObject({ code: 'INVALID_PATH' });
  });

  it('rejects a path containing backslashes (Windows separators)', async () => {
    await expect(
      uploadFile('vehicles', 'a\\b.jpg', Buffer.from('x')),
    ).rejects.toMatchObject({ code: 'INVALID_PATH' });
  });

  it('rejects an empty path', async () => {
    await expect(uploadFile('vehicles', '   ', Buffer.from('x'))).rejects.toMatchObject({
      code: 'MISSING_PATH',
    });
  });

  it('accepts a normal relative storage key', async () => {
    uploadMock.mockClear();
    const result = await uploadFile('vehicles', 'vehicle-1/img.jpg', Buffer.from('x'), {
      contentType: 'image/jpeg',
    });
    expect(result.path).toBe('test/path');
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// G. Overwrite behaviour
// ---------------------------------------------------------------------------

describe('uploadFile() — overwrite behaviour', () => {
  it('defaults to upsert: false (no overwrite)', async () => {
    uploadMock.mockClear();
    await uploadFile('vehicles', 'vehicle-1/img.jpg', Buffer.from('x'), {
      contentType: 'image/jpeg',
    });
    expect(uploadMock).toHaveBeenCalledWith(
      'vehicle-1/img.jpg',
      expect.anything(),
      expect.objectContaining({ upsert: false }),
    );
  });

  it('keeps upsert: false when explicitly passed by upload callers', async () => {
    uploadMock.mockClear();
    await uploadFile('documents', 'orders/abc/doc.pdf', PDF_BYTES, {
      contentType: 'application/pdf',
      upsert: false,
    });
    expect(uploadMock).toHaveBeenCalledWith(
      'orders/abc/doc.pdf',
      expect.anything(),
      expect.objectContaining({ upsert: false }),
    );
  });
});

// ---------------------------------------------------------------------------
// I. Phase 5A bucket / URL regressions remain intact
// ---------------------------------------------------------------------------

describe('Phase 5A storage boundaries — unchanged by Phase 6', () => {
  it('still rejects public URL generation for the private documents bucket', async () => {
    const { getPublicUrl } = await import('@/lib/supabase/storage');
    expect(() => getPublicUrl('documents', 'secret.pdf')).toThrow(StorageError);
  });

  it('still generates public URLs for vehicle images', async () => {
    const { getPublicUrl } = await import('@/lib/supabase/storage');
    const url = getPublicUrl('vehicles', 'v1/img.jpg');
    expect(url).toBe('https://test.supabase.co/storage/v1/object/public/vehicles/v1/img.jpg');
  });

  it('still rejects arbitrary buckets', async () => {
    await expect(
      uploadFile('not-a-real-bucket', 'x.jpg', Buffer.from('x')),
    ).rejects.toMatchObject({ code: 'DISALLOWED_BUCKET' });
  });

  it('mediaActions no longer defines an unprotected local getPublicUrl', () => {
    const src = readSrc('server/actions/mediaActions.ts');
    expect(src).not.toMatch(/function getPublicUrl\s*\(/);
  });

  it('no upload module generates a public URL for the documents bucket', () => {
    const modules = [
      'server/actions/documentUpload.ts',
      'server/actions/documentActions.ts',
      'server/services/vehicleService.ts',
      'server/actions/mediaActions.ts',
    ];
    for (const mod of modules) {
      const src = readSrc(mod);
      expect(src).not.toMatch(/getPublicUrl\(\s*['"]documents['"]/);
      expect(src).not.toMatch(/getPublicUrl\(\s*STORAGE_BUCKETS\.documents/);
    }
  });
});

// ---------------------------------------------------------------------------
// L/M. Authorization-before-upload and entrypoint hardening (source analysis)
// ---------------------------------------------------------------------------

describe('authorization and validation order (source analysis)', () => {
  it('documentUpload: authenticates and authorises before validating/uploading', () => {
    const src = readSrc('server/actions/documentUpload.ts');
    const authIdx = src.indexOf('await requirePermission(');
    const validateIdx = src.indexOf('validateUploadFile(file');
    const uploadIdx = src.indexOf('await uploadFile(');
    expect(authIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(validateIdx);
    expect(validateIdx).toBeLessThan(uploadIdx);
  });

  it('documentUpload: order id is UUID-validated and the order must exist before upload', () => {
    const src = readSrc('server/actions/documentUpload.ts');
    expect(src).toContain('UUIDSchema.parse(orderId)');
    expect(src).toContain('orderRepo.orders.findById(orderId)');
    const existIdx = src.indexOf('orderRepo.orders.findById(orderId)');
    const uploadIdx = src.indexOf('await uploadFile(');
    expect(existIdx).toBeLessThan(uploadIdx);
  });

  it('documentActions: authenticates and authorises before validating/uploading', () => {
    const src = readSrc('server/actions/documentActions.ts');
    const fn = src.slice(
      src.indexOf('export async function uploadDocumentFile'),
      src.indexOf('const CreateDocumentSchema'),
    );
    const authIdx = fn.indexOf('await requirePermission(');
    const validateIdx = fn.indexOf('validateUploadFile(file');
    const uploadIdx = fn.indexOf('await uploadFile(');
    expect(authIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(validateIdx);
    expect(validateIdx).toBeLessThan(uploadIdx);
  });

  it('mediaActions uploadMedia: authorises, validates, then uploads', () => {
    const src = readSrc('server/actions/mediaActions.ts');
    const fn = src.slice(
      src.indexOf('export async function uploadMedia'),
      src.indexOf('export async function uploadVehicleMedia'),
    );
    const authIdx = fn.indexOf('await requirePermission(');
    const validateIdx = fn.indexOf('validateUploadFile(file');
    const uploadIdx = fn.indexOf('await uploadFile(');
    expect(authIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(validateIdx);
    expect(validateIdx).toBeLessThan(uploadIdx);
  });

  it('mediaActions uploadVehicleMedia: authorises, validates, then uploads', () => {
    const src = readSrc('server/actions/mediaActions.ts');
    const fn = src.slice(
      src.indexOf('export async function uploadVehicleMedia'),
      src.indexOf('export async function deleteMedia'),
    );
    const authIdx = fn.indexOf('await requirePermission(');
    const validateIdx = fn.indexOf('validateUploadFile(file');
    const uploadIdx = fn.indexOf('await uploadFile(');
    expect(authIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(validateIdx);
    expect(validateIdx).toBeLessThan(uploadIdx);
  });

  it('vehicleService uploadVehicleDocument: vehicle exists and file is validated before upload', () => {
    const src = readSrc('server/services/vehicleService.ts');
    const fn = src.slice(
      src.indexOf('async uploadVehicleDocument'),
      src.indexOf('async getVehicleStatusHistory'),
    );
    const existIdx = fn.indexOf('this.vehicleRepo.findById(vehicleId)');
    const validateIdx = fn.indexOf('validateUploadFile(file');
    const uploadIdx = fn.indexOf('await uploadFile(');
    expect(existIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(-1);
    expect(existIdx).toBeLessThan(validateIdx);
    expect(validateIdx).toBeLessThan(uploadIdx);
  });

  it('vehicleService uploadImages: vehicle exists and file is validated before upload', () => {
    const src = readSrc('server/services/vehicleService.ts');
    const fn = src.slice(src.indexOf('async uploadImages'), src.indexOf('async softDeleteVehicle'));
    const existIdx = fn.indexOf('this.vehicleRepo.findById(vehicleId)');
    const validateIdx = fn.indexOf('validateUploadFile(file');
    const uploadIdx = fn.indexOf('await uploadFile(');
    expect(existIdx).toBeGreaterThan(-1);
    expect(validateIdx).toBeGreaterThan(-1);
    expect(uploadIdx).toBeGreaterThan(-1);
    expect(existIdx).toBeLessThan(validateIdx);
    expect(validateIdx).toBeLessThan(uploadIdx);
  });

  it('vehicleActions uploadVehicleImages: authorises before invoking the service upload', () => {
    const src = readSrc('server/actions/vehicleActions.ts');
    const fn = src.slice(
      src.indexOf('export async function uploadVehicleImages'),
      src.indexOf('export async function softDeleteVehicle'),
    );
    const authIdx = fn.indexOf('await requirePermission(');
    const serviceIdx = fn.indexOf('vehicleService.uploadImages(');
    expect(authIdx).toBeGreaterThan(-1);
    expect(serviceIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(serviceIdx);
  });

  it('vehicleActions uploadVehicleDocumentFileAction: authorises before invoking the service upload', () => {
    const src = readSrc('server/actions/vehicleActions.ts');
    const fn = src.slice(
      src.indexOf('export async function uploadVehicleDocumentFileAction'),
      src.indexOf('export async function getVehicleStatusHistoryAction'),
    );
    const authIdx = fn.indexOf('await requirePermission(');
    const serviceIdx = fn.indexOf('vehicleService.uploadVehicleDocument(');
    expect(authIdx).toBeGreaterThan(-1);
    expect(serviceIdx).toBeGreaterThan(-1);
    expect(authIdx).toBeLessThan(serviceIdx);
  });

  it('all six upload entrypoints use the canonical validation layer', () => {
    const entrypoints = [
      'server/actions/documentUpload.ts',
      'server/actions/documentActions.ts',
      'server/actions/mediaActions.ts',
      'server/services/vehicleService.ts',
    ];
    for (const mod of entrypoints) {
      expect(readSrc(mod)).toContain("from '@/lib/supabase/upload-validation'");
    }
  });

  it('no upload entrypoint requests upsert/overwrite', () => {
    const entrypoints = [
      'server/actions/documentUpload.ts',
      'server/actions/documentActions.ts',
      'server/actions/mediaActions.ts',
      'server/services/vehicleService.ts',
    ];
    for (const mod of entrypoints) {
      expect(readSrc(mod)).not.toContain('upsert: true');
    }
  });

  it('upload entrypoints no longer build storage paths from raw filename extensions', () => {
    const entrypoints = [
      'server/actions/documentUpload.ts',
      'server/actions/documentActions.ts',
      'server/services/vehicleService.ts',
    ];
    for (const mod of entrypoints) {
      const src = readSrc(mod);
      expect(src).not.toContain("file.name.split('.').pop()");
    }
  });
});
