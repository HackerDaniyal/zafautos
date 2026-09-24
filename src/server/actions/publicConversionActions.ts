'use server';

import { db } from '@/server/db/client';
import { vehicleEnquiries, vehicleWishlist, vehicleViews, vehicles, vehicleImages, manufacturers, models, bodyTypes, fuelTypes, transmissions, countries, whatsappClicks } from '@/server/db/schema';
import { eq, and, sql, inArray, isNull } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth/session';
import { z } from 'zod';
import { VehicleRepository } from '@/server/repositories/vehicleRepository';
import {
  enforceRateLimit,
  getRateLimitIdentifierAuthenticated,
  getServerActionRateLimitIdentifier,
} from '@/lib/api/rateLimiter';

const vehicleRepo = new VehicleRepository();

const ENQUIRY_RATE_LIMIT = 5;
const ENQUIRY_RATE_WINDOW_MS = 10 * 60 * 1000;
const TRACKING_RATE_LIMIT = 60;
const TRACKING_RATE_WINDOW_MS = 10 * 60 * 1000;
const COMPARE_SEARCH_RATE_LIMIT = 60;
const COMPARE_SEARCH_RATE_WINDOW_MS = 60 * 1000;

/** user:{id} when logged in, else trusted client IP, else null (skip — fail-open). */
async function getPublicIdentifier(userId?: string | null): Promise<string | null> {
  if (userId) return getRateLimitIdentifierAuthenticated(userId);
  return getServerActionRateLimitIdentifier();
}

// ── Helpers ──────────────────────────────────────────

async function validateActiveVehicle(vehicleId: string): Promise<boolean> {
  if (!vehicleId) return false;
  const [vehicle] = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.id, vehicleId),
        eq(vehicles.status, 'active'),
        sql`${vehicles.deletedAt} IS NULL`,
      ),
    )
    .limit(1);
  return !!vehicle;
}

// ── Enquiry ──────────────────────────────────────────

const EnquirySchema = z.object({
  vehicleId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z.string().email('Valid email is required').max(254).trim(),
  phone: z.string().max(50).trim().optional(),
  country: z.string().max(100).trim().optional(),
  message: z.string().min(1, 'Message is required').max(5000).trim(),
});

export type EnquiryInput = z.infer<typeof EnquirySchema>;

export async function submitVehicleEnquiry(data: EnquiryInput) {
  const validated = EnquirySchema.parse(data);

  // Optional login (also used as the rate-limit identifier when present)
  let userId: string | null = null;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch {
    // Not logged in — that's fine for enquiries
  }

  const identifier = await getPublicIdentifier(userId);
  if (identifier) {
    try {
      await enforceRateLimit('vehicle-enquiries', identifier, ENQUIRY_RATE_LIMIT, ENQUIRY_RATE_WINDOW_MS);
    } catch {
      return {
        success: false,
        error: 'Too many enquiries. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      };
    }
  }

  // CRITICAL: Verify vehicle exists and is active/published
  const vehicleValid = await validateActiveVehicle(validated.vehicleId);
  if (!vehicleValid) {
    return { success: false, error: 'Vehicle not found or no longer available', code: 'VEHICLE_NOT_FOUND' };
  }

  // Structured message — not just concatenated strings
  const messageLines = [
    `Name: ${validated.name}`,
    `Email: ${validated.email}`,
    validated.phone ? `Phone: ${validated.phone}` : null,
    validated.country ? `Country: ${validated.country}` : null,
    '',
    'Message:',
    validated.message,
  ].filter(Boolean).join('\n');

  const [enquiry] = await db
    .insert(vehicleEnquiries)
    .values({
      vehicleId: validated.vehicleId,
      userId,
      message: messageLines,
      customerName: validated.name,
      customerEmail: validated.email,
      customerPhone: validated.phone || null,
      customerCountry: validated.country || null,
      source: 'website',
    })
    .returning();

  return { success: true, id: enquiry.id };
}

// ── Wishlist ─────────────────────────────────────────

export async function toggleWishlist(vehicleId: string) {
  if (!vehicleId) return { success: false, error: 'Vehicle ID required' };

  // Validate vehicleId format
  const parsedId = z.string().uuid().safeParse(vehicleId);
  if (!parsedId.success) {
    return { success: false, error: 'Invalid vehicle ID' };
  }

  // Require authenticated user
  let userId: string;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch {
    return { success: false, error: 'Login required', code: 'AUTH_REQUIRED' };
  }

  // Verify vehicle exists and is active
  const vehicleValid = await validateActiveVehicle(vehicleId);
  if (!vehicleValid) {
    return { success: false, error: 'Vehicle not found or no longer available', code: 'VEHICLE_NOT_FOUND' };
  }

  // Check if already wishlisted
  const existing = await db
    .select()
    .from(vehicleWishlist)
    .where(
      and(
        eq(vehicleWishlist.userId, userId),
        eq(vehicleWishlist.vehicleId, vehicleId),
        sql`${vehicleWishlist.deletedAt} IS NULL`,
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove from wishlist (soft delete)
    await db
      .update(vehicleWishlist)
      .set({ deletedAt: new Date() })
      .where(eq(vehicleWishlist.id, existing[0].id));
    return { success: true, wishlisted: false };
  }

  // Add to wishlist
  await db.insert(vehicleWishlist).values({
    userId,
    vehicleId,
  });
  return { success: true, wishlisted: true };
}

export async function checkWishlistStatus(vehicleId: string) {
  if (!vehicleId) return { wishlisted: false };

  let userId: string;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch {
    return { wishlisted: false };
  }

  const existing = await db
    .select()
    .from(vehicleWishlist)
    .where(
      and(
        eq(vehicleWishlist.userId, userId),
        eq(vehicleWishlist.vehicleId, vehicleId),
        sql`${vehicleWishlist.deletedAt} IS NULL`,
      ),
    )
    .limit(1);

  return { wishlisted: existing.length > 0 };
}

// ── Vehicle View Tracking ─────────────────────────────

export async function trackVehicleView(vehicleId: string) {
  if (!vehicleId) return;

  // Validate UUID format
  const parsedId = z.string().uuid().safeParse(vehicleId);
  if (!parsedId.success) return;

  let userId: string | null = null;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch {
    // Anonymous view — still track it
  }

  // Best-effort tracking: when over the limit, silently skip instead of
  // throwing — rate limiting must never break the page (and IP buckets can
  // collide behind CGNAT).
  const identifier = await getPublicIdentifier(userId);
  if (identifier) {
    try {
      await enforceRateLimit('vehicle-views', identifier, TRACKING_RATE_LIMIT, TRACKING_RATE_WINDOW_MS);
    } catch {
      return;
    }
  }

  try {
    // Duplicate prevention: check if this user already viewed this vehicle recently (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const conditions = [
      eq(vehicleViews.vehicleId, vehicleId),
      sql`${vehicleViews.viewedAt} > ${oneHourAgo}`,
    ];
    if (userId) {
      conditions.push(eq(vehicleViews.userId, userId));
    } else {
      conditions.push(sql`${vehicleViews.userId} IS NULL`);
    }

    const [recentView] = await db
      .select({ id: vehicleViews.id })
      .from(vehicleViews)
      .where(and(...conditions))
      .limit(1);

    if (recentView) return; // Already tracked recently — skip

    await db.insert(vehicleViews).values({
      vehicleId,
      userId,
    });
  } catch {
    // Silently fail — view tracking should never break the page
  }
}

// ── Compare: Search Vehicles ──────────────────────────

export async function getVehiclesByIds(ids: string[]) {
  const safeIds = ids.filter((id) => z.string().uuid().safeParse(id).success).slice(0, 50);
  if (safeIds.length === 0) return [];

  const vehicleRows = await db
    .select()
    .from(vehicles)
    .where(
      and(
        inArray(vehicles.id, safeIds),
        eq(vehicles.status, 'active'),
        isNull(vehicles.deletedAt)
      )
    );
  if (vehicleRows.length === 0) return [];

  const vIds = vehicleRows.map((v) => v.id);

  const [allImages, manufacturersData, modelsData, bodyTypesData, fuelTypesData, transmissionsData, countriesData] = await Promise.all([
    db.select().from(vehicleImages).where(inArray(vehicleImages.vehicleId, vIds)),
    db.select().from(manufacturers),
    db.select().from(models),
    db.select().from(bodyTypes),
    db.select().from(fuelTypes),
    db.select().from(transmissions),
    db.select().from(countries),
  ]);

  const mfgMap = new Map(manufacturersData.map((m) => [m.id, m.name]));
  const modelMap = new Map(modelsData.map((m) => [m.id, m.name]));
  const btMap = new Map(bodyTypesData.map((b) => [b.id, b.name]));
  const ftMap = new Map(fuelTypesData.map((f) => [f.id, f.name]));
  const trMap = new Map(transmissionsData.map((t) => [t.id, t.name]));
  const cMap = new Map(countriesData.map((c) => [c.id, c.name]));

  const primaryImageMap = new Map<string, string>();
  const imageCountMap = new Map<string, number>();
  for (const img of allImages) {
    imageCountMap.set(img.vehicleId, (imageCountMap.get(img.vehicleId) ?? 0) + 1);
    if (img.isPrimary) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }
  for (const img of allImages) {
    if (!primaryImageMap.has(img.vehicleId)) primaryImageMap.set(img.vehicleId, img.imageUrl);
  }

  return vehicleRows.map((v) => ({
    id: v.id,
    slug: v.slug ?? '',
    make: v.manufacturerId ? (mfgMap.get(v.manufacturerId) ?? 'Unknown') : 'Unknown',
    model: v.modelId ? (modelMap.get(v.modelId) ?? 'Unknown') : 'Unknown',
    year: v.year ?? 0,
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeId ? (ftMap.get(v.fuelTypeId) ?? 'Unknown') : 'Unknown',
    transmission: v.transmissionId ? (trMap.get(v.transmissionId) ?? 'Unknown') : 'Unknown',
    bodyType: v.bodyTypeId ? (btMap.get(v.bodyTypeId) ?? 'Unknown') : 'Unknown',
    location: v.countryId ? (cMap.get(v.countryId) ?? '') : '',
    condition: v.condition ?? '',
    isFeatured: v.isFeatured ?? false,
    imageUrl: primaryImageMap.get(v.id) ?? null,
    imageCount: imageCountMap.get(v.id) ?? 0,
    stockId: v.stockNumber ?? null,
    recentlyAdded: false,
  }));
}

export async function searchVehiclesForCompare(query: string, excludeIds: string[] = []) {
  // Public typeahead search — throttle per client IP; degrade to no results
  // when over the limit so the compare UI keeps functioning.
  const identifier = await getServerActionRateLimitIdentifier();
  if (identifier) {
    try {
      await enforceRateLimit('compare-search', identifier, COMPARE_SEARCH_RATE_LIMIT, COMPARE_SEARCH_RATE_WINDOW_MS);
    } catch {
      return [];
    }
  }

  // Sanitize inputs
  const safeQuery = (query || '').slice(0, 200).trim();
  const safeExcludeIds = excludeIds.filter((id) => z.string().uuid().safeParse(id).success).slice(0, 10);

  const result = await vehicleRepo.listWithRelations({
    filters: {
      status: 'active',
      search: safeQuery || undefined,
    },
    pagination: { page: 1, limit: 20 },
    sort: { column: 'createdAt', direction: 'desc' },
  });

  return result.data
    .filter((v: any) => !safeExcludeIds.includes(v.id))
    .map((v: any) => ({
      id: v.id,
      slug: v.slug ?? '',
      make: v._manufacturerName ?? 'Unknown',
      model: v._modelName ?? 'Unknown',
      year: v.year ?? 0,
      price: v.price ?? 0,
      currency: 'USD',
      mileage: v.mileage ?? 0,
      fuelType: v._fuelTypeName ?? 'Unknown',
      transmission: v._transmissionTypeName ?? 'Unknown',
      bodyType: v._bodyTypeName ?? 'Unknown',
      location: v._countryName ?? '',
      condition: v.condition ?? '',
      isFeatured: v.isFeatured ?? false,
      imageUrl: v.primaryImageUrl ?? null,
      imageCount: 0,
      stockId: v.stockNumber ?? null,
      recentlyAdded: false,
    }));
}

// ── WhatsApp Click Tracking ────────────────────────

export async function trackWhatsappClick(vehicleId: string, source: string = 'vehicle_detail') {
  if (!vehicleId) return;

  const parsedId = z.string().uuid().safeParse(vehicleId);
  if (!parsedId.success) return;

  const safeSource = (source || 'vehicle_detail').slice(0, 100);

  let userId: string | null = null;
  try {
    const auth = await requireAuth();
    userId = auth.userId;
  } catch {
    // Anonymous click — still track
  }

  // Best-effort tracking: over-limit clicks are dropped silently.
  const identifier = await getPublicIdentifier(userId);
  if (identifier) {
    try {
      await enforceRateLimit('whatsapp-clicks', identifier, TRACKING_RATE_LIMIT, TRACKING_RATE_WINDOW_MS);
    } catch {
      return;
    }
  }

  try {
    await db.insert(whatsappClicks).values({
      vehicleId,
      userId,
      source: safeSource,
    });
  } catch {
    // Silently fail — tracking should never break the page
  }
}
