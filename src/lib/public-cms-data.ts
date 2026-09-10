import { db } from '@/server/db/client';
import { banners, testimonials, faqs, blogPosts, homepageSections } from '@/server/db/schema/cms';
import { vehicles, vehicleImages, manufacturers, bodyTypes, countries, currencies, continents } from '@/server/db/schema';
import { eq, and, desc, asc, sql, isNull, gte, lte, inArray, or } from 'drizzle-orm';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PublicBanner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  displayOrder: number;
}

export interface PublicTestimonial {
  id: string;
  customerName: string;
  customerLocation: string | null;
  customerImageUrl: string | null;
  quote: string;
  rating: number | null;
  vehicleId: string | null;
}

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  displayOrder: number;
}

export interface PublicBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featuredImageUrl: string | null;
  author: string | null;
  category: string | null;
  tags: string | null;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
}

// ── Banners ────────────────────────────────────────────────────────────────

export async function getPublicBanners(placement?: string): Promise<PublicBanner[]> {
  const now = new Date();
  const conditions = [
    isNull(banners.deletedAt),
    eq(banners.isActive, true),
    or(isNull(banners.startDate), lte(banners.startDate, now))!,
    or(isNull(banners.endDate), gte(banners.endDate, now))!,
  ];
  if (placement) conditions.push(eq(banners.placement, placement));

  const rows = await db
    .select({
      id: banners.id,
      title: banners.title,
      description: banners.description,
      imageUrl: banners.imageUrl,
      mobileImageUrl: banners.mobileImageUrl,
      buttonText: banners.buttonText,
      buttonLink: banners.buttonLink,
      displayOrder: banners.displayOrder,
    })
    .from(banners)
    .where(and(...conditions))
    .orderBy(asc(banners.displayOrder));

  return rows;
}

// ── Testimonials ───────────────────────────────────────────────────────────

export async function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  const rows = await db
    .select({
      id: testimonials.id,
      customerName: testimonials.customerName,
      customerLocation: testimonials.customerLocation,
      customerImageUrl: testimonials.customerImageUrl,
      quote: testimonials.quote,
      rating: testimonials.rating,
      vehicleId: testimonials.vehicleId,
    })
    .from(testimonials)
    .where(and(isNull(testimonials.deletedAt), eq(testimonials.isPublished, true)))
    .orderBy(asc(testimonials.displayOrder));

  return rows;
}

// ── FAQs ───────────────────────────────────────────────────────────────────

export async function getPublicFaqs(): Promise<PublicFaq[]> {
  const rows = await db
    .select({
      id: faqs.id,
      question: faqs.question,
      answer: faqs.answer,
      category: faqs.category,
      displayOrder: faqs.displayOrder,
    })
    .from(faqs)
    .where(and(isNull(faqs.deletedAt), eq(faqs.isPublished, true)))
    .orderBy(asc(faqs.displayOrder));

  return rows;
}

// ── Blog Posts ─────────────────────────────────────────────────────────────

export async function getPublicBlogPosts(options: { page?: number; limit?: number; category?: string } = {}): Promise<{ items: PublicBlogPost[]; total: number; page: number; limit: number; totalPages: number }> {
  const { page = 1, limit = 12, category } = options;
  const offset = (page - 1) * limit;

  const conditions = [isNull(blogPosts.deletedAt), eq(blogPosts.status, 'published')];
  if (category) conditions.push(eq(blogPosts.category, category));

  const where = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db.select().from(blogPosts).where(where).orderBy(desc(blogPosts.publishedAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(blogPosts).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicBlogPostBySlug(slug: string): Promise<PublicBlogPost | null> {
  const [result] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), isNull(blogPosts.deletedAt), eq(blogPosts.status, 'published')));

  return result ?? null;
}

// ── Homepage Sections ──────────────────────────────────────────────────────

export async function getPublicHomepageSections() {
  return db
    .select()
    .from(homepageSections)
    .where(and(isNull(homepageSections.deletedAt), eq(homepageSections.isEnabled, true)))
    .orderBy(asc(homepageSections.displayOrder));
}

// ── Homepage Vehicles ──────────────────────────────────────────────────────

export async function getHomepageVehicles(): Promise<{ featured: VehicleCardData[]; latest: VehicleCardData[] }> {
  const conditions = [isNull(vehicles.deletedAt), eq(vehicles.status, 'active')];

  const vehicleRows = await db
    .select({
      id: vehicles.id,
      slug: vehicles.slug,
      year: vehicles.year,
      price: vehicles.price,
      mileage: vehicles.mileage,
      condition: vehicles.condition,
      isFeatured: vehicles.isFeatured,
      stockNumber: vehicles.stockNumber,
      manufacturerName: manufacturers.name,
      bodyTypeName: bodyTypes.name,
      countryName: countries.name,
    })
    .from(vehicles)
    .leftJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
    .leftJoin(bodyTypes, eq(vehicles.bodyTypeId, bodyTypes.id))
    .leftJoin(countries, eq(vehicles.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(desc(vehicles.createdAt))
    .limit(42);

  if (vehicleRows.length === 0) return { featured: [], latest: [] };

  const vehicleIds = vehicleRows.map(v => v.id);
  const imageRows = await db
    .select({
      vehicleId: vehicleImages.vehicleId,
      imageUrl: vehicleImages.imageUrl,
      isPrimary: vehicleImages.isPrimary,
      sortOrder: vehicleImages.sortOrder,
    })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, vehicleIds))
    .orderBy(vehicleImages.sortOrder);

  const primaryImages = new Map<string, string>();
  const imageCounts = new Map<string, number>();
  for (const img of imageRows) {
    const count = imageCounts.get(img.vehicleId) ?? 0;
    imageCounts.set(img.vehicleId, count + 1);
    if (img.isPrimary || !primaryImages.has(img.vehicleId)) {
      primaryImages.set(img.vehicleId, img.imageUrl);
    }
  }

  const mapped: VehicleCardData[] = vehicleRows.map(v => ({
    id: v.id,
    slug: v.slug ?? '',
    make: v.manufacturerName ?? 'Unknown',
    model: '',
    year: v.year ?? 0,
    price: v.price ?? 0,
    currency: 'USD',
    mileage: v.mileage ?? 0,
    fuelType: '',
    transmission: '',
    bodyType: v.bodyTypeName ?? '',
    location: v.countryName ?? '',
    condition: v.condition ?? '',
    isFeatured: v.isFeatured ?? false,
    imageUrl: primaryImages.get(v.id),
    imageCount: imageCounts.get(v.id) ?? 0,
    stockId: v.stockNumber ?? undefined,
  }));

  const featured = mapped.filter(v => v.isFeatured).slice(0, 28);
  const latest = mapped.slice(0, 14);

  return { featured, latest };
}

// ── Homepage Makes ─────────────────────────────────────────────────────────

export async function getHomepageMakes() {
  const rows = await db
    .select({
      id: manufacturers.id,
      name: manufacturers.name,
      slug: manufacturers.slug,
      logoUrl: manufacturers.logoUrl,
    })
    .from(manufacturers)
    .where(and(eq(manufacturers.isActive, true), isNull(manufacturers.deletedAt)))
    .orderBy(manufacturers.displayOrder, manufacturers.name);

  return rows;
}

// ── Homepage Continents/Countries ──────────────────────────────────────────

export async function getHomepageContinents() {
  const continentRows = await db
    .select({ id: continents.id, name: continents.name, slug: continents.slug })
    .from(continents)
    .where(eq(continents.isActive, true))
    .orderBy(continents.displayOrder, continents.name);

  const countryRows = await db
    .select({
      id: countries.id,
      name: countries.name,
      slug: countries.slug,
      flagImage: countries.flagImage,
      continentId: countries.continentId,
    })
    .from(countries)
    .where(and(eq(countries.isActive, true), isNull(countries.deletedAt)))
    .orderBy(countries.displayOrder, countries.name);

  return continentRows.map(cont => ({
    ...cont,
    countries: countryRows
      .filter(c => c.continentId === cont.id)
      .map(c => ({ id: c.id, name: c.name, slug: c.slug, flagImage: c.flagImage })),
  }));
}

// ── Homepage Lookup Items ──────────────────────────────────────────────────

export async function getHomepageBodyTypes() {
  const rows = await db
    .select({ id: bodyTypes.id, name: bodyTypes.name })
    .from(bodyTypes)
    .where(and(eq(bodyTypes.isActive, true), isNull(bodyTypes.deletedAt)))
    .orderBy(bodyTypes.displayOrder, bodyTypes.name);
  return rows;
}

// ── Currencies ─────────────────────────────────────────────────────────────

export async function getHomepageCurrencies() {
  const rows = await db
    .select({ id: currencies.id, code: currencies.code, name: currencies.name, symbol: currencies.symbol })
    .from(currencies)
    .where(eq(currencies.isActive, true))
    .orderBy(currencies.displayOrder, currencies.code);
  return rows.map(r => ({ ...r, symbol: r.symbol ?? '' }));
}
