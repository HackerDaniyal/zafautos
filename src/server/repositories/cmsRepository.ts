import { cmsPages, cmsPageVersions, homepageSections, menus } from '@/server/db/schema';
import { eq, and, or, like, sql, desc, asc, inArray, type SQL } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { BaseRepository, type PaginatedResult, type PaginationOptions, type SortOptions } from './baseRepository';

export class CmsRepository {
  public readonly pages = new BaseRepository(cmsPages);
  public readonly versions = new BaseRepository(cmsPageVersions);
  public readonly sections = new BaseRepository(homepageSections);
  public readonly menuItems = new BaseRepository(menus);

  // ── Pages ──────────────────────────────────────────────────────────────────

  async listPages(options: {
    pagination?: PaginationOptions;
    sort?: SortOptions;
    search?: string;
    status?: string;
  } = {}): Promise<PaginatedResult<typeof cmsPages.$inferSelect>> {
    const { pagination, sort, search, status } = options;
    const { page = 1, limit = 20 } = pagination ?? {};
    const { column: sortCol, direction = 'desc' } = sort ?? {};

    const conditions: SQL[] = [sql`${cmsPages.deletedAt} IS NULL`];

    if (status) {
      conditions.push(sql`${cmsPages.status} = ${status}`);
    }
    if (search) {
      conditions.push(
        or(
          like(cmsPages.title, `%${search}%`),
          like(cmsPages.slug, `%${search}%`),
        )!,
      );
    }

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(cmsPages)
      .where(whereClause);

    const sortFn = direction === 'asc' ? asc : desc;
    const sortColumn = sortCol && (cmsPages as unknown as Record<string, unknown>)[sortCol]
      ? (cmsPages as unknown as Record<string, unknown>)[sortCol]
      : cmsPages.createdAt;

    const data = await db
      .select()
      .from(cmsPages)
      .where(whereClause)
      .orderBy(sortFn(sortColumn as any))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }

  async findBySlug(slug: string, includeDeleted = false) {
    const conditions: SQL[] = [sql`${cmsPages.slug} = ${slug}`];
    if (!includeDeleted) {
      conditions.push(sql`${cmsPages.deletedAt} IS NULL`);
    }
    const [result] = await db.select().from(cmsPages).where(and(...conditions)).limit(1);
    return result ?? null;
  }

  async findPublishedBySlug(slug: string) {
    const [result] = await db
      .select()
      .from(cmsPages)
      .where(and(
        sql`${cmsPages.slug} = ${slug}`,
        sql`${cmsPages.status} = 'published'`,
        sql`${cmsPages.deletedAt} IS NULL`,
      ))
      .limit(1);
    return result ?? null;
  }

  // ── Page Versions ──────────────────────────────────────────────────────────

  async listVersions(pageId: string) {
    return db
      .select()
      .from(cmsPageVersions)
      .where(eq(cmsPageVersions.pageId, pageId))
      .orderBy(desc(cmsPageVersions.versionNumber));
  }

  async getLatestVersionNumber(pageId: string): Promise<number> {
    const [result] = await db
      .select({ maxVersion: sql<number>`coalesce(max(${cmsPageVersions.versionNumber}), 0)` })
      .from(cmsPageVersions)
      .where(eq(cmsPageVersions.pageId, pageId));
    return result?.maxVersion ?? 0;
  }

  // ── Homepage Sections ──────────────────────────────────────────────────────

  async listSections() {
    return db
      .select()
      .from(homepageSections)
      .where(sql`${homepageSections.deletedAt} IS NULL`)
      .orderBy(homepageSections.displayOrder);
  }

  async listEnabledSections() {
    return db
      .select()
      .from(homepageSections)
      .where(and(
        sql`${homepageSections.isEnabled} = true`,
        sql`${homepageSections.deletedAt} IS NULL`,
      ))
      .orderBy(homepageSections.displayOrder);
  }

  // ── Menus ──────────────────────────────────────────────────────────────────

  async listMenusByLocation(location: string) {
    return db
      .select()
      .from(menus)
      .where(and(
        sql`${menus.location} = ${location}`,
        sql`${menus.isEnabled} = true`,
        sql`${menus.deletedAt} IS NULL`,
      ))
      .orderBy(menus.displayOrder);
  }

  async listAllMenus(location?: string) {
    const conditions: SQL[] = [sql`${menus.deletedAt} IS NULL`];
    if (location) {
      conditions.push(sql`${menus.location} = ${location}`);
    }
    return db
      .select()
      .from(menus)
      .where(and(...conditions))
      .orderBy(menus.displayOrder);
  }

  async getMaxDisplayOrder(table: typeof homepageSections | typeof menus): Promise<number> {
    const [result] = await db
      .select({ maxOrder: sql<number>`coalesce(max(${table.displayOrder}), 0)` })
      .from(table)
      .where(sql`${table.deletedAt} IS NULL`);
    return result?.maxOrder ?? 0;
  }
}
