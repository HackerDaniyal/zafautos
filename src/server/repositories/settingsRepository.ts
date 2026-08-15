import { BaseRepository } from './baseRepository';
import { continents, countries, currencies, siteSettings, systemSettings, taxRates, emailTemplates, notificationRules } from '@/server/db/schema';
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

// ── Tax Rates ─────────────────────────────────────────────────────────────

export class TaxRatesRepository extends BaseRepository<typeof taxRates> {
  constructor() {
    super(taxRates);
  }

  async findActive() {
    return this.db.select().from(taxRates)
      .where(sql`${taxRates.deletedAt} IS NULL AND ${taxRates.isActive} = true`)
      .orderBy(asc(taxRates.displayOrder), asc(taxRates.name));
  }

  async findByCountry(countryId: string) {
    return this.db.select().from(taxRates)
      .where(sql`${taxRates.countryId} = ${countryId} AND ${taxRates.deletedAt} IS NULL AND ${taxRates.isActive} = true`)
      .orderBy(asc(taxRates.displayOrder));
  }

  async setAllNotDefault() {
    await this.db.update(taxRates)
      .set({ isDefault: false })
      .where(sql`${taxRates.isDefault} = true`);
  }

  async listWithCountry() {
    return db
      .select({
        id: taxRates.id,
        name: taxRates.name,
        countryId: taxRates.countryId,
        rate: taxRates.rate,
        type: taxRates.type,
        isDefault: taxRates.isDefault,
        isActive: taxRates.isActive,
        displayOrder: taxRates.displayOrder,
        createdAt: taxRates.createdAt,
        updatedAt: taxRates.updatedAt,
        deletedAt: taxRates.deletedAt,
        countryName: countries.name,
      })
      .from(taxRates)
      .leftJoin(countries, eq(taxRates.countryId, countries.id))
      .where(sql`${taxRates.deletedAt} IS NULL`)
      .orderBy(asc(taxRates.displayOrder), asc(taxRates.name));
  }
}

// ── Site Settings (key-value store) ────────────────────────────────────────

export class SiteSettingsRepository extends BaseRepository<typeof siteSettings> {
  constructor() {
    super(siteSettings);
  }

  async getByKey(key: string) {
    const result = await this.db.select().from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);
    return result[0] ?? null;
  }

  async upsertByKey(key: string, value: string, userId?: string) {
    const [result] = await this.db.insert(siteSettings)
      .values({
        key,
        value,
        ...(userId ? { createdBy: userId, updatedBy: userId } : {}),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value,
          updatedAt: new Date(),
          ...(userId ? { updatedBy: userId } : {}),
        },
      })
      .returning();
    return result;
  }
}

// ── System Settings (key-value store) ──────────────────────────────────────

export class SystemSettingsRepository extends BaseRepository<typeof systemSettings> {
  constructor() {
    super(systemSettings);
  }

  async getByKey(key: string) {
    const result = await this.db.select().from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);
    return result[0] ?? null;
  }

  async upsertByKey(key: string, value: string, userId?: string) {
    const [result] = await this.db.insert(systemSettings)
      .values({
        key,
        value,
        ...(userId ? { createdBy: userId, updatedBy: userId } : {}),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: {
          value,
          updatedAt: new Date(),
          ...(userId ? { updatedBy: userId } : {}),
        },
      })
      .returning();
    return result;
  }
}

// ── Email Templates ───────────────────────────────────────────────────────

export class EmailTemplatesRepository extends BaseRepository<typeof emailTemplates> {
  constructor() {
    super(emailTemplates);
  }

  async findActive() {
    return this.db.select().from(emailTemplates)
      .where(sql`${emailTemplates.deletedAt} IS NULL AND ${emailTemplates.isActive} = true`)
      .orderBy(asc(emailTemplates.name));
  }

  async findByKey(key: string) {
    return this.findByField('key', key);
  }
}

// ── Notification Rules ────────────────────────────────────────────────────

export class NotificationRulesRepository extends BaseRepository<typeof notificationRules> {
  constructor() {
    super(notificationRules);
  }

  async findByEventType(eventType: string) {
    return this.findByField('eventType', eventType);
  }

  async findAllActive() {
    return this.db.select().from(notificationRules)
      .where(sql`${notificationRules.isEnabled} = true`)
      .orderBy(asc(notificationRules.eventType));
  }
}
