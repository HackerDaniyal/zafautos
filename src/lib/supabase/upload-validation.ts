import { getFileExtension } from '@/lib/supabase/storage-helpers';

// ---------------------------------------------------------------------------
// Upload category configuration
// ---------------------------------------------------------------------------
// Derived from existing per-entrypoint business rules. Do not expand these
// sets without an explicit product decision.

export const UPLOAD_CATEGORIES = {
  /** Vehicle gallery images — vehicles bucket (public). */
  vehicleImages: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 10 * 1024 * 1024,
  },
  /** Vehicle documents — documents bucket (private). */
  vehicleDocuments: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxBytes: 20 * 1024 * 1024,
  },
  /** Order documents — documents bucket (private). */
  orderDocuments: {
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ],
    maxBytes: 20 * 1024 * 1024,
  },
  /** Admin/document-manager uploads — documents bucket (private). */
  adminDocuments: {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxBytes: 20 * 1024 * 1024,
  },
  /** CMS/general media — media bucket (public). */
  cmsMedia: {
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'video/mp4',
    ],
    maxBytes: 10 * 1024 * 1024,
  },
} as const;

export type UploadCategoryName = keyof typeof UPLOAD_CATEGORIES;

export interface UploadCategoryConfig {
  allowedTypes: readonly string[];
  maxBytes: number;
}

// ---------------------------------------------------------------------------
// Allowed filename extensions per claimed MIME type
// ---------------------------------------------------------------------------

const ALLOWED_EXTENSIONS: Record<string, readonly string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  // svgz (gzip-compressed SVG) is intentionally NOT allowed: compressed
  // content cannot be inspected for scriptable payloads, and gzip bytes
  // already fail magic-byte detection as image/svg+xml.
  'image/svg+xml': ['svg'],
  'application/pdf': ['pdf'],
  'text/csv': ['csv'],
  'video/mp4': ['mp4', 'm4v'],
  'application/msword': ['doc'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
};

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface UploadValidationSuccess {
  valid: true;
  buffer: Buffer;
  claimedType: string;
  detectedType: string;
  safeExtension: string;
}

export interface UploadValidationFailure {
  valid: false;
  code: string;
  reason: string;
}

export type UploadValidationResult = UploadValidationSuccess | UploadValidationFailure;

// ---------------------------------------------------------------------------
// Magic-byte content detection
// ---------------------------------------------------------------------------

function startsWithBytes(buffer: Uint8Array, bytes: readonly number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Detect the actual file type from content (magic bytes / text head).
 * Returns a MIME type, or `null` when the content cannot be identified.
 *
 * This inspects real bytes — it never trusts the client-supplied MIME type.
 */
export function detectFileType(buffer: Uint8Array): string | null {
  // JPEG: FF D8 FF
  if (startsWithBytes(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  // GIF87a / GIF89a: 47 49 46 38
  if (startsWithBytes(buffer, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  // WEBP: RIFF....WEBP
  if (
    startsWithBytes(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    startsWithBytes(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }
  // PDF: %PDF
  if (startsWithBytes(buffer, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf';
  // MP4/M4V: ....ftyp
  if (startsWithBytes(buffer, [0x66, 0x74, 0x79, 0x70], 4)) return 'video/mp4';
  // OLE compound document (legacy .doc / .xls): D0 CF 11 E0 A1 B1 1A E1
  if (startsWithBytes(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return 'application/x-ole-storage';
  }
  // ZIP container (.docx / .xlsx): PK\x03\x04
  if (startsWithBytes(buffer, [0x50, 0x4b, 0x03, 0x04])) return 'application/zip';

  // Text-based formats: any NUL byte means binary we do not recognise.
  const probeLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < probeLength; i++) {
    if (buffer[i] === 0) return null;
  }
  const head = new TextDecoder('utf-8', { fatal: false })
    .decode(buffer.subarray(0, probeLength))
    .trim()
    .toLowerCase();
  if (head.startsWith('<svg') || (head.startsWith('<?xml') && head.includes('<svg'))) {
    return 'image/svg+xml';
  }
  return 'text/plain';
}

// ---------------------------------------------------------------------------
// Compatibility / extension rules
// ---------------------------------------------------------------------------

function isContentTypeCompatible(detected: string, claimed: string): boolean {
  if (detected === claimed) return true;
  // OOXML documents are ZIP containers.
  if (
    detected === 'application/zip' &&
    (claimed === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      claimed === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  ) {
    return true;
  }
  // Legacy Office files are OLE compound documents.
  if (
    detected === 'application/x-ole-storage' &&
    (claimed === 'application/msword' || claimed === 'application/vnd.ms-excel')
  ) {
    return true;
  }
  // CSV is plain text and has no unique binary signature.
  if (detected === 'text/plain' && claimed === 'text/csv') return true;
  return false;
}

function isExtensionAllowed(extension: string, claimedType: string): boolean {
  const allowed = ALLOWED_EXTENSIONS[claimedType];
  if (!allowed) return false;
  return allowed.includes(extension);
}

// ---------------------------------------------------------------------------
// SVG safety inspection (Phase 8 — stored-XSS prevention)
// ---------------------------------------------------------------------------
// SVGs are permitted only for the public `cmsMedia` category (media bucket).
// A direct navigation to a stored SVG executes its script in the storage
// origin, and any inline-injection of its markup would execute in the app
// origin — so uploads are rejected when they contain scriptable content.
//
// Policy: FAIL CLOSED with an allowlist-oriented structural scan of the
// entity-decoded text. This deliberately rejects SMIL <animate>/<set>
// (attribute/URL-rewriting XSS vectors), DOCTYPE/ENTITY declarations
// (XXE / billion-laughs), event-handler attributes, javascript: and
// dangerous data: URLs, external URL references in href/xlink:href/src,
// @import and external url() references. Local fragment references
// (href="#id", url(#grad)) and embedded raster data: URIs remain allowed.
// All 201 repo-provided flag SVGs pass this scan unchanged.

export type SvgSafetyResult =
  | { safe: true }
  | { safe: false; reason: string };

function codePointOrEmpty(value: number): string {
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) return '';
  try {
    return String.fromCodePoint(value);
  } catch {
    return '';
  }
}

/**
 * Decode XML character references exactly once — the same single pass an XML
 * parser performs before markup is interpreted. `&amp;` is replaced last so
 * double-encoded references are NOT unwrapped (matching parser semantics:
 * `&amp;lt;script&amp;gt;` stays inert text in a real XML document).
 */
function decodeXmlEntitiesOnce(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codePointOrEmpty(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec: string) => codePointOrEmpty(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function truncateForReason(value: string): string {
  return value.length > 80 ? `${value.slice(0, 80)}…` : value;
}

/**
 * Inspect an SVG buffer for scriptable / externally-referenceable content.
 * Returns `{ safe: false, reason }` on the FIRST violation found.
 */
export function inspectSvgSafety(buffer: Uint8Array): SvgSafetyResult {
  // NUL bytes are forbidden in XML — their presence means the content is not
  // a well-formed SVG regardless of what the text around them looks like.
  if (buffer.includes(0)) {
    return { safe: false, reason: 'SVG must not contain NUL bytes' };
  }

  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  const decoded = decodeXmlEntitiesOnce(text);

  if (/<!doctype|<!entity/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not contain a DOCTYPE or ENTITY declaration' };
  }
  if (/<script/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not contain script elements' };
  }
  if (
    /<foreignobject|<iframe|<embed|<object[\s>]|<frame|<frameset|<meta[\s>]|<link[\s>]|<base[\s>]|<form[\s>]|<handler|<set[\s>]|<animate/i.test(
      decoded,
    )
  ) {
    return {
      safe: false,
      reason: 'SVG must not contain embedded HTML, frames, or SMIL animate/set elements',
    };
  }
  if (/[\s"'<]on[a-z]+\s*=/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not contain inline event handlers' };
  }
  if (/java\s*script\s*:/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not contain javascript: URLs' };
  }
  if (/data:text\/html|data:application\/xhtml|data:image\/svg/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not embed dangerous data: URLs' };
  }

  // URL-bearing attributes: only same-document fragments and embedded safe
  // raster data are allowed — anything else (https:, //host, relative paths,
  // unknown schemes) is an external reference.
  const urlAttrPattern = /(?:xlink:href|href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let urlMatch: RegExpExecArray | null;
  while ((urlMatch = urlAttrPattern.exec(decoded)) !== null) {
    const value = (urlMatch[1] ?? urlMatch[2] ?? '').trim();
    if (value === '') continue;
    if (value.startsWith('#')) continue;
    if (/^data:image\/(png|jpe?g|gif|webp|bmp|avif)[;,]/i.test(value)) continue;
    return {
      safe: false,
      reason: `SVG URL references must be local fragments or embedded raster data (found: "${truncateForReason(value)}")`,
    };
  }

  if (/@import/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not contain @import rules' };
  }
  if (/url\s*\(\s*['"]?\s*(?:https?:|\/\/|[a-z][a-z0-9+.-]*:)/i.test(decoded)) {
    return { safe: false, reason: 'SVG must not reference external resources via url()' };
  }

  return { safe: true };
}

// ---------------------------------------------------------------------------
// Canonical upload validation
// ---------------------------------------------------------------------------

/**
 * Validate a user-supplied file before it is written to storage.
 *
 * Checks, in order:
 *   1. non-empty
 *   2. size (before the file is read)
 *   3. client-declared MIME type present and in the category allowlist
 *   4. actual content type via magic bytes (single read)
 *   5. content / declared-type agreement
 *   6. filename extension agreement with the validated type
 *
 * Returns the read buffer so callers can upload it without a second read.
 * `file.type` is treated purely as an untrusted claim that must agree with
 * the detected content — it is never the security authority.
 */
export async function validateUploadFile(
  file: File,
  category: UploadCategoryName,
): Promise<UploadValidationResult> {
  const config: UploadCategoryConfig = UPLOAD_CATEGORIES[category];

  if (!file || file.size === 0) {
    return { valid: false, code: 'EMPTY_FILE', reason: 'No file provided' };
  }

  if (file.size > config.maxBytes) {
    const maxMB = Math.round(config.maxBytes / 1024 / 1024);
    const fileMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      code: 'FILE_TOO_LARGE',
      reason: `File size ${fileMB} MB exceeds maximum ${maxMB} MB`,
    };
  }

  const claimedType = file.type;
  if (!claimedType) {
    return {
      valid: false,
      code: 'MISSING_CONTENT_TYPE',
      reason: 'Unable to determine file type',
    };
  }
  if (!config.allowedTypes.includes(claimedType)) {
    return {
      valid: false,
      code: 'INVALID_TYPE',
      reason: `File type "${claimedType}" is not allowed. Allowed: ${config.allowedTypes.join(', ')}`,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const detectedType = detectFileType(buffer);
  if (!detectedType) {
    return {
      valid: false,
      code: 'UNDETECTABLE_CONTENT',
      reason: 'File content does not match a supported format',
    };
  }
  if (!isContentTypeCompatible(detectedType, claimedType)) {
    return {
      valid: false,
      code: 'CONTENT_MISMATCH',
      reason: `File content type "${detectedType}" does not match declared type "${claimedType}"`,
    };
  }

  const extension = getFileExtension(file.name);
  if (!extension || !isExtensionAllowed(extension, claimedType)) {
    return {
      valid: false,
      code: 'EXTENSION_MISMATCH',
      reason: 'File extension does not match the validated file type',
    };
  }

  // Phase 8: SVGs that pass type/extension checks must additionally contain no
  // scriptable or externally-referenceable content (stored-XSS prevention).
  if (claimedType === 'image/svg+xml') {
    const svgSafety = inspectSvgSafety(buffer);
    if (!svgSafety.safe) {
      return {
        valid: false,
        code: 'UNSAFE_SVG_CONTENT',
        reason: svgSafety.reason,
      };
    }
  }

  return {
    valid: true,
    buffer,
    claimedType,
    detectedType,
    safeExtension: extension,
  };
}
