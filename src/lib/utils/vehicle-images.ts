const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const STORAGE_BUCKET = 'vehicles';

/**
 * Resolves a vehicle image URL from either a full URL or a raw storage path.
 *
 * Handles:
 *   - Full public URLs (returned unchanged)
 *   - Raw storage paths like "vehicleId/file.jpg" (prefixed with Supabase URL)
 *   - Null/empty values (returned as empty string)
 *
 * This is the SINGLE source of truth for image URL resolution.
 */
export function resolveVehicleImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl || typeof imageUrl !== 'string') return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${imageUrl}`;
  }

  return '';
}

/**
 * Extracts the Supabase storage path from either a full URL or a raw path.
 *
 * Handles:
 *   - Full URLs: "https://...supabase.co/storage/v1/object/public/vehicles/vehicleId/file.jpg"
 *     → "vehicleId/file.jpg"
 *   - Raw paths: "vehicleId/file.jpg"
 *     → "vehicleId/file.jpg"
 *
 * Used for Storage delete operations.
 */
export function getVehicleStoragePath(imageUrl: string): string {
  if (!imageUrl) return '';

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const marker = `/object/public/${STORAGE_BUCKET}/`;
    const idx = imageUrl.indexOf(marker);
    if (idx !== -1) {
      return imageUrl.substring(idx + marker.length);
    }
    return '';
  }

  return imageUrl;
}
