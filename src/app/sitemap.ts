import type { MetadataRoute } from 'next';
import { db } from '@/server/db/client';
import { blogPosts } from '@/server/db/schema/cms';
import {
  vehicles,
  manufacturers,
  models,
  bodyTypes,
  countries,
} from '@/server/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

const BASE_URL = 'https://zafautos.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/vehicles`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Published blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await db
      .select({ slug: blogPosts.slug, publishedAt: blogPosts.publishedAt, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(and(isNull(blogPosts.deletedAt), eq(blogPosts.status, 'published')))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(100);

    blogPages = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt || post.updatedAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // If blog query fails, return static pages only
  }

  // Active vehicles
  let vehiclePages: MetadataRoute.Sitemap = [];
  try {
    const vehiclesList = await db
      .select({ slug: vehicles.slug, updatedAt: vehicles.updatedAt })
      .from(vehicles)
      .where(and(isNull(vehicles.deletedAt), eq(vehicles.status, 'active')))
      .orderBy(desc(vehicles.updatedAt))
      .limit(500);

    vehiclePages = vehiclesList
      .filter((v) => v.slug)
      .map((v) => ({
        url: `${BASE_URL}/vehicles/${v.slug}`,
        lastModified: v.updatedAt || now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    // If vehicle query fails, return static + blog pages only
  }

  // Manufacturer landing pages
  let manufacturerPages: MetadataRoute.Sitemap = [];
  try {
    const manufacturerList = await db
      .select({
        slug: manufacturers.slug,
        updatedAt: manufacturers.updatedAt,
        vehicleCount: sql<number>`count(${vehicles.id})::int`,
      })
      .from(manufacturers)
      .leftJoin(vehicles, and(
        eq(vehicles.manufacturerId, manufacturers.id),
        eq(vehicles.status, 'active'),
        isNull(vehicles.deletedAt),
      ))
      .where(isNull(manufacturers.deletedAt))
      .groupBy(manufacturers.id, manufacturers.slug)
      .having(sql`count(${vehicles.id}) > 0`);

    manufacturerPages = manufacturerList
      .filter((m) => m.slug)
      .map((m) => ({
        url: `${BASE_URL}/vehicles/manufacturer/${m.slug}`,
        lastModified: m.updatedAt || now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch {
    // Silently fail
  }

  // Model landing pages
  let modelPages: MetadataRoute.Sitemap = [];
  try {
    const modelList = await db
      .select({
        slug: models.slug,
        updatedAt: models.updatedAt,
        vehicleCount: sql<number>`count(${vehicles.id})::int`,
      })
      .from(models)
      .leftJoin(vehicles, and(
        eq(vehicles.modelId, models.id),
        eq(vehicles.status, 'active'),
        isNull(vehicles.deletedAt),
      ))
      .where(isNull(models.deletedAt))
      .groupBy(models.id, models.slug)
      .having(sql`count(${vehicles.id}) > 0`);

    modelPages = modelList
      .filter((m) => m.slug)
      .map((m) => ({
        url: `${BASE_URL}/vehicles/model/${m.slug}`,
        lastModified: m.updatedAt || now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    // Silently fail
  }

  // Body type landing pages (body_types don't have slug column, use lowercased name)
  let bodyTypePages: MetadataRoute.Sitemap = [];
  try {
    const bodyTypeList = await db
      .select({
        name: bodyTypes.name,
        updatedAt: bodyTypes.updatedAt,
        vehicleCount: sql<number>`count(${vehicles.id})::int`,
      })
      .from(bodyTypes)
      .leftJoin(vehicles, and(
        eq(vehicles.bodyTypeId, bodyTypes.id),
        eq(vehicles.status, 'active'),
        isNull(vehicles.deletedAt),
      ))
      .where(isNull(bodyTypes.deletedAt))
      .groupBy(bodyTypes.id, bodyTypes.name)
      .having(sql`count(${vehicles.id}) > 0`);

    bodyTypePages = bodyTypeList
      .filter((b) => b.name)
      .map((b) => ({
        url: `${BASE_URL}/vehicles/body-type/${encodeURIComponent(b.name.toLowerCase())}`,
        lastModified: b.updatedAt || now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    // Silently fail
  }

  // Destination landing pages
  let destinationPages: MetadataRoute.Sitemap = [];
  try {
    const countryList = await db
      .select({
        slug: countries.slug,
        updatedAt: countries.updatedAt,
        vehicleCount: sql<number>`count(${vehicles.id})::int`,
      })
      .from(countries)
      .leftJoin(vehicles, and(
        eq(vehicles.countryId, countries.id),
        eq(vehicles.status, 'active'),
        isNull(vehicles.deletedAt),
      ))
      .where(and(isNull(countries.deletedAt), eq(countries.isActive, true)))
      .groupBy(countries.id, countries.slug)
      .having(sql`count(${vehicles.id}) > 0`);

    destinationPages = countryList
      .filter((c) => c.slug)
      .map((c) => ({
        url: `${BASE_URL}/vehicles/destination/${c.slug}`,
        lastModified: c.updatedAt || now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch {
    // Silently fail
  }

  return [
    ...staticPages,
    ...blogPages,
    ...vehiclePages,
    ...manufacturerPages,
    ...modelPages,
    ...bodyTypePages,
    ...destinationPages,
  ];
}
