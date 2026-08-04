import { BaseRepository } from './baseRepository';
import { continents, countries, currencies } from '@/server/db/schema';
import { sql, asc, eq, and, like, or, desc } from 'drizzle-orm';
import { db } from '@/server/db/client';

export class CountriesRepository extends BaseRepository<typeof countries> {
  constructor() {
    super(countries);
  }

  async findActive() {
    return this.db.select().from(countries)
      .where(sql`${countries.deletedAt} IS NULL AND ${countries.isActive} = true`)
      .orderBy(asc(countries.displayOrder), asc(countries.name));
  }

  async findBySlug(slug: string) {
    return this.findByField('slug', slug);
  }

  async listWithContinent(options: {
    page?: number;
    limit?: number;
    search?: string;
    continentId?: string;
    isActive?: boolean;
    sort?: { column?: string; direction?: 'asc' | 'desc' };
  } = {}) {
    const { page = 1, limit = 20, search, continentId, isActive, sort } = options;

    const conditions: any[] = [sql`${countries.deletedAt} IS NULL`];

    if (continentId) {
      conditions.push(eq(countries.continentId, continentId));
    }
    if (isActive !== undefined) {
      conditions.push(eq(countries.isActive, isActive));
    }
    if (search) {
      conditions.push(or(
        like(countries.name, `%${search}%`),
        like(countries.slug, `%${search}%`),
      ));
    }

    const whereClause = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(countries)
      .where(whereClause);

    const sortCol = sort?.column === 'name' ? countries.name :
                    sort?.column === 'displayOrder' ? countries.displayOrder :
                    countries.name;
    const sortFn = sort?.direction === 'asc' ? asc : desc;

    const data = await db
      .select({
        id: countries.id,
        name: countries.name,
        slug: countries.slug,
        flagImage: countries.flagImage,
        currencyId: countries.currencyId,
        continentId: countries.continentId,
        isActive: countries.isActive,
        displayOrder: countries.displayOrder,
        createdAt: countries.createdAt,
        updatedAt: countries.updatedAt,
        createdBy: countries.createdBy,
        updatedBy: countries.updatedBy,
        deletedAt: countries.deletedAt,
        deletedBy: countries.deletedBy,
        continentName: continents.name,
        currencyCode: currencies.code,
        currencySymbol: currencies.symbol,
      })
      .from(countries)
      .leftJoin(continents, eq(countries.continentId, continents.id))
      .leftJoin(currencies, eq(countries.currencyId, currencies.id))
      .where(whereClause)
      .orderBy(sortFn(sortCol))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data,
      meta: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    };
  }
}

export class ContinentsRepository extends BaseRepository<typeof continents> {
  constructor() {
    super(continents);
  }

  async findActive() {
    return this.db.select().from(continents)
      .where(sql`${continents.deletedAt} IS NULL AND ${continents.isActive} = true`)
      .orderBy(asc(continents.displayOrder));
  }

  async listWithCountryCount() {
    return db
      .select({
        id: continents.id,
        name: continents.name,
        slug: continents.slug,
        isActive: continents.isActive,
        displayOrder: continents.displayOrder,
        createdAt: continents.createdAt,
        updatedAt: continents.updatedAt,
        countryCount: sql<number>`count(${countries.id})::int`,
      })
      .from(continents)
      .leftJoin(countries, and(
        eq(continents.id, countries.continentId),
        sql`${countries.deletedAt} IS NULL`
      ))
      .where(sql`${continents.deletedAt} IS NULL`)
      .groupBy(continents.id)
      .orderBy(asc(continents.displayOrder));
  }
}

export class CurrenciesRepository extends BaseRepository<typeof currencies> {
  constructor() {
    super(currencies);
  }

  async findActive() {
    return this.db.select().from(currencies)
      .where(sql`${currencies.deletedAt} IS NULL AND ${currencies.isActive} = true`)
      .orderBy(asc(currencies.displayOrder), asc(currencies.name));
  }

  async findByCode(code: string) {
    return this.findByField('code', code);
  }

  async setAllNotDefault() {
    await this.db.update(currencies)
      .set({ isDefault: false })
      .where(sql`${currencies.isDefault} = true`);
  }
}
