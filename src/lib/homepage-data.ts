import { db } from '@/server/db/client';
import {
  vehicles, vehicleImages, vehicleDestinationCountries, manufacturers, bodyTypes, fuelTypes, transmissions, driveTypes,
  countries, currencies, continents,
} from '@/server/db/schema';
import { eq, and, desc, asc, sql, inArray, isNull, or, gte, lte } from 'drizzle-orm';
import { banners, testimonials, faqs, blogPosts, homepageSections } from '@/server/db/schema/cms';
import type { VehicleCardData } from '@/components/marketplace/VehicleCard';
import type { PublicBanner, PublicTestimonial, PublicFaq, PublicBlogPost } from '@/lib/public-cms-data';

// ── Types ──────────────────────────────────────────────────────────────────

export interface HomepageSectionData {
  id: string;
  type: string;
  isEnabled: boolean;
  displayOrder: number;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
  button2Label: string | null;
  button2Url: string | null;
  extraData: Record<string, unknown> | null;
}

export interface HomepageCurrency {
  id: string;
  code: string;
  name: string;
  symbol: string;
}

export interface HomepageMake {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  count: number;
}

export interface HomepageContinent {
  id: string;
  name: string;
  slug: string;
  countries: {
    id: string;
    name: string;
    slug: string;
    flagImage: string | null;
    count: number;
  }[];
}

export interface HomepageLookupItem {
  id: string;
  name: string;
}

export interface HomepageData {
  sections: HomepageSectionData[];
  featuredVehicles: VehicleCardData[];
  latestVehicles: VehicleCardData[];
  currencies: HomepageCurrency[];
  exchangeRates: Record<string, number>;
  makes: HomepageMake[];
  continents: HomepageContinent[];
  bodyTypes: HomepageLookupItem[];
  fuelTypes: HomepageLookupItem[];
  transmissions: HomepageLookupItem[];
  driveTypes: HomepageLookupItem[];
  banners: PublicBanner[];
  testimonials: PublicTestimonial[];
  faqs: PublicFaq[];
  latestBlogPosts: PublicBlogPost[];
}

// ── Vehicle Fetching ───────────────────────────────────────────────────────

async function fetchVehiclesWithImages(
  filters: { isFeatured?: boolean; status?: string },
  limit: number,
): Promise<VehicleCardData[]> {
  const conditions = [sql`${vehicles.deletedAt} IS NULL`];
  conditions.push(eq(vehicles.status, (filters.status ?? 'active') as 'active'));
  if (filters.isFeatured !== undefined) {
    conditions.push(eq(vehicles.isFeatured, filters.isFeatured));
  }

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
      currencyId: vehicles.currencyId,
      manufacturerName: manufacturers.name,
      bodyTypeName: bodyTypes.name,
      fuelTypeName: fuelTypes.name,
      transmissionName: transmissions.name,
      countryName: countries.name,
    })
    .from(vehicles)
    .leftJoin(manufacturers, eq(vehicles.manufacturerId, manufacturers.id))
    .leftJoin(bodyTypes, eq(vehicles.bodyTypeId, bodyTypes.id))
    .leftJoin(fuelTypes, eq(vehicles.fuelTypeId, fuelTypes.id))
    .leftJoin(transmissions, eq(vehicles.transmissionId, transmissions.id))
    .leftJoin(countries, eq(vehicles.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(desc(vehicles.createdAt))
    .limit(limit);

  if (vehicleRows.length === 0) return [];

  const vehicleIds = vehicleRows.map((v) => v.id);
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

  // Resolve currency codes
  const currencyIds = [...new Set(vehicleRows.map((v) => v.currencyId).filter(Boolean))] as string[];
  const currencyRows = currencyIds.length > 0
    ? await db.select({ id: currencies.id, code: currencies.code })
        .from(currencies)
        .where(inArray(currencies.id, currencyIds))
    : [];
  const currencyMap = new Map(currencyRows.map((c) => [c.id, c.code]));

  // Fetch destination country IDs for each vehicle
  const destRows = vehicleIds.length > 0
    ? await db.select({ vehicleId: vehicleDestinationCountries.vehicleId, countryId: vehicleDestinationCountries.countryId })
        .from(vehicleDestinationCountries)
        .where(inArray(vehicleDestinationCountries.vehicleId, vehicleIds))
    : [];
  const destMap = new Map<string, string[]>();
  for (const d of destRows) {
    const existing = destMap.get(d.vehicleId) ?? [];
    existing.push(d.countryId);
    destMap.set(d.vehicleId, existing);
  }

  return vehicleRows.map((v) => ({
    id: v.id,
    slug: v.slug ?? '',
    make: v.manufacturerName ?? 'Unknown',
    model: '',
    year: v.year ?? 0,
    price: v.price ?? 0,
    currency: v.currencyId ? (currencyMap.get(v.currencyId) ?? 'USD') : 'USD',
    mileage: v.mileage ?? 0,
    fuelType: v.fuelTypeName ?? '',
    transmission: v.transmissionName ?? '',
    bodyType: v.bodyTypeName ?? '',
    location: v.countryName ?? '',
    condition: v.condition ?? '',
    isFeatured: v.isFeatured ?? false,
    imageUrl: primaryImages.get(v.id),
    imageCount: imageCounts.get(v.id) ?? 0,
    stockId: v.stockNumber ?? undefined,
    destinationCountryIds: destMap.get(v.id) ?? [],
  }));
}

// ── CMS Data Fetching ──────────────────────────────────────────────────────

async function fetchHomepageSections(): Promise<HomepageSectionData[]> {
  const rows = await db
    .select()
    .from(homepageSections)
    .where(and(isNull(homepageSections.deletedAt), eq(homepageSections.isEnabled, true)))
    .orderBy(asc(homepageSections.displayOrder));
  return rows as HomepageSectionData[];
}

async function fetchActiveBanners(): Promise<PublicBanner[]> {
  const now = new Date();
  const conditions = [
    isNull(banners.deletedAt),
    eq(banners.isActive, true),
    or(isNull(banners.startDate), lte(banners.startDate, now))!,
    or(isNull(banners.endDate), gte(banners.endDate, now))!,
  ];

  return db
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
}

async function fetchPublishedTestimonials(): Promise<PublicTestimonial[]> {
  return db
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
}

async function fetchPublishedFaqs(): Promise<PublicFaq[]> {
  return db
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
}

async function fetchLatestBlogPosts(): Promise<PublicBlogPost[]> {
  return db
    .select()
    .from(blogPosts)
    .where(and(isNull(blogPosts.deletedAt), eq(blogPosts.status, 'published')))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(6);
}

// ── Lookup Data ────────────────────────────────────────────────────────────

async function fetchHomepageCurrencies(): Promise<HomepageCurrency[]> {
  const rows = await db
    .select({ id: currencies.id, code: currencies.code, name: currencies.name, symbol: currencies.symbol })
    .from(currencies)
    .where(eq(currencies.isActive, true))
    .orderBy(currencies.displayOrder, currencies.code);
  return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, symbol: r.symbol ?? '' }));
}

async function fetchExchangeRates(): Promise<Record<string, number>> {
  const rows = await db
    .select({ code: currencies.code, rate: currencies.exchangeRate })
    .from(currencies)
    .where(eq(currencies.isActive, true));
  const rates: Record<string, number> = {};
  for (const r of rows) {
    rates[r.code] = parseFloat(r.rate);
  }
  return rates;
}

async function fetchHomepageMakes(): Promise<HomepageMake[]> {
  const makeCounts = await db
    .select({ id: vehicles.manufacturerId, count: sql<number>`count(*)::int` })
    .from(vehicles)
    .where(and(isNull(vehicles.deletedAt), eq(vehicles.status, 'active')))
    .groupBy(vehicles.manufacturerId);
  const countMap = new Map(makeCounts.map((c) => [c.id, c.count]));

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

  return rows
    .map((r) => ({ ...r, count: countMap.get(r.id) ?? 0 }))
    .filter((r) => r.count > 0);
}

export async function fetchHomepageContinents(): Promise<HomepageContinent[]> {
  // Count vehicles per destination country using the junction table
  const destCounts = await db
    .select({ countryId: vehicleDestinationCountries.countryId, count: sql<number>`count(*)::int` })
    .from(vehicleDestinationCountries)
    .innerJoin(vehicles, eq(vehicleDestinationCountries.vehicleId, vehicles.id))
    .where(and(isNull(vehicles.deletedAt), eq(vehicles.status, 'active')))
    .groupBy(vehicleDestinationCountries.countryId);
  const destCountMap = new Map(destCounts.map((c) => [c.countryId, c.count]));

  // Only fetch continents that have at least one active destination country
  const activeCountryIds = destCounts.map((c) => c.countryId).filter(Boolean) as string[];
  if (activeCountryIds.length === 0) return [];

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
    .where(and(eq(countries.isActive, true), isNull(countries.deletedAt), inArray(countries.id, activeCountryIds)))
    .orderBy(countries.displayOrder, countries.name);

  return continentRows
    .map((cont) => ({
      id: cont.id,
      name: cont.name,
      slug: cont.slug,
      countries: countryRows
        .filter((c) => c.continentId === cont.id && (destCountMap.get(c.id) ?? 0) > 0)
        .map((c) => ({ id: c.id, name: c.name, slug: c.slug, flagImage: c.flagImage, count: destCountMap.get(c.id) ?? 0 })),
    }))
    .filter((cont) => cont.countries.length > 0);
}

async function fetchActiveBodyTypes(): Promise<HomepageLookupItem[]> {
  const rows = await db
    .select({ id: bodyTypes.id, name: bodyTypes.name })
    .from(bodyTypes)
    .where(and(eq(bodyTypes.isActive, true), isNull(bodyTypes.deletedAt)))
    .orderBy(bodyTypes.displayOrder, bodyTypes.name);
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

async function fetchActiveFuelTypes(): Promise<HomepageLookupItem[]> {
  const rows = await db
    .select({ id: fuelTypes.id, name: fuelTypes.name })
    .from(fuelTypes)
    .where(and(eq(fuelTypes.isActive, true), isNull(fuelTypes.deletedAt)))
    .orderBy(fuelTypes.displayOrder, fuelTypes.name);
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

async function fetchActiveTransmissions(): Promise<HomepageLookupItem[]> {
  const rows = await db
    .select({ id: transmissions.id, name: transmissions.name })
    .from(transmissions)
    .where(and(eq(transmissions.isActive, true), isNull(transmissions.deletedAt)))
    .orderBy(transmissions.displayOrder, transmissions.name);
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

async function fetchActiveDriveTypes(): Promise<HomepageLookupItem[]> {
  const rows = await db
    .select({ id: driveTypes.id, name: driveTypes.name })
    .from(driveTypes)
    .where(and(eq(driveTypes.isActive, true), isNull(driveTypes.deletedAt)))
    .orderBy(driveTypes.displayOrder, driveTypes.name);
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

// ── Main Export ────────────────────────────────────────────────────────────

export async function getHomepageData(): Promise<HomepageData> {
  const [
    sections, featuredVehicles, latestVehicles,
    currenciesData, exchangeRatesData, makesData, continentsData,
    bodyTypesData, fuelTypesData, transmissionsData, driveTypesData,
    bannersData, testimonialsData, faqsData, blogPostsData,
  ] = await Promise.all([
    fetchHomepageSections(),
    fetchVehiclesWithImages({ isFeatured: true, status: 'active' }, 33),
    fetchVehiclesWithImages({ status: 'active' }, 33),
    fetchHomepageCurrencies(),
    fetchExchangeRates(),
    fetchHomepageMakes(),
    fetchHomepageContinents(),
    fetchActiveBodyTypes(),
    fetchActiveFuelTypes(),
    fetchActiveTransmissions(),
    fetchActiveDriveTypes(),
    fetchActiveBanners(),
    fetchPublishedTestimonials(),
    fetchPublishedFaqs(),
    fetchLatestBlogPosts(),
  ]);

  return {
    sections,
    featuredVehicles,
    latestVehicles,
    currencies: currenciesData,
    exchangeRates: exchangeRatesData,
    makes: makesData,
    continents: continentsData,
    bodyTypes: bodyTypesData,
    fuelTypes: fuelTypesData,
    transmissions: transmissionsData,
    driveTypes: driveTypesData,
    banners: bannersData,
    testimonials: testimonialsData,
    faqs: faqsData,
    latestBlogPosts: blogPostsData,
  };
}
