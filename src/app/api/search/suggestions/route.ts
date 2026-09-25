import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { manufacturers, models, vehicles } from '@/server/db/schema';
import { and, like, sql, eq, isNull } from 'drizzle-orm';
import { enforceRateLimit, getRateLimitIdentifier, RateLimitExceededError } from '@/lib/api/rateLimiter';
import { apiError } from '@/lib/api/response';

const MAX_SUGGESTIONS = 8;

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    await enforceRateLimit('search-suggestions', getRateLimitIdentifier(request), RATE_LIMIT, RATE_WINDOW_MS);
  } catch (error) {
    const headers = new Headers();
    if (error instanceof RateLimitExceededError && error.retryAfterSeconds) {
      headers.set('Retry-After', String(error.retryAfterSeconds));
    }
    return apiError('Too many requests. Please try again later.', 'RATE_LIMITED', 429, undefined, headers);
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const term = `%${q}%`;

  try {
    // Fetch matching manufacturers
    const matchingManufacturers = await db
      .select({ id: manufacturers.id, name: manufacturers.name })
      .from(manufacturers)
      .where(and(
        like(manufacturers.name, term),
        isNull(manufacturers.deletedAt),
      ))
      .limit(3);

    // Fetch matching models (with manufacturer name for context)
    const matchingModels = db
      .select({
        modelId: models.id,
        modelName: models.name,
        manufacturerId: models.manufacturerId,
        manufacturerName: manufacturers.name,
      })
      .from(models)
      .innerJoin(manufacturers, eq(models.manufacturerId, manufacturers.id))
      .where(and(
        like(models.name, term),
        isNull(models.deletedAt),
        isNull(manufacturers.deletedAt),
      ))
      .limit(5);

    // Fetch popular vehicles matching the term
    const matchingVehicles = db
      .select({
        slug: vehicles.slug,
        year: vehicles.year,
        manufacturerName: manufacturers.name,
        modelName: models.name,
      })
      .from(vehicles)
      .innerJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
      .innerJoin(models, eq(vehicles.modelId, models.id))
      .where(and(
        eq(vehicles.status, 'active'),
        isNull(vehicles.deletedAt),
        sql`(${like(manufacturers.name, term)} OR ${like(models.name, term)})`,
      ))
      .orderBy(sql`${vehicles.isFeatured} DESC, ${vehicles.createdAt} DESC`)
      .limit(5);

    const [modelsResults, vehiclesResults] = await Promise.all([matchingModels, matchingVehicles]);

    // Build suggestions list
    const suggestions: Array<{
      type: 'manufacturer' | 'model' | 'vehicle';
      text: string;
      slug?: string;
      subtitle?: string;
    }> = [];

    // Add manufacturer suggestions
    for (const m of matchingManufacturers) {
      suggestions.push({
        type: 'manufacturer',
        text: m.name,
      });
    }

    // Add model suggestions (with manufacturer context)
    for (const m of modelsResults) {
      suggestions.push({
        type: 'model',
        text: `${m.manufacturerName} ${m.modelName}`,
        subtitle: m.manufacturerName,
      });
    }

    // Add vehicle suggestions
    for (const v of vehiclesResults) {
      if (v.slug) {
        suggestions.push({
          type: 'vehicle',
          text: `${v.year} ${v.manufacturerName} ${v.modelName}`,
          slug: v.slug,
        });
      }
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, MAX_SUGGESTIONS),
    });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
