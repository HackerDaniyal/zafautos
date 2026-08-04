import { CountriesRepository, ContinentsRepository, CurrenciesRepository } from '@/server/repositories';
import { z } from 'zod';
import { ValidationError } from './errors';
import { db } from '@/server/db/client';
import { sql } from 'drizzle-orm';
import { continents as continentsTable, countries as countriesTable } from '@/server/db/schema/settings';
import { currencies as currenciesTable } from '@/server/db/schema/payments';
import continentsData from '@/data/reference/continents.json';
import currenciesData from '@/data/reference/currencies.json';
import countriesData from '@/data/reference/countries.json';

export const CreateContinentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(100).optional(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const UpdateContinentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const CreateCountrySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().max(255).optional(),
  flagImage: z.string().optional().nullable(),
  currencyId: z.string().uuid().optional().nullable(),
  continentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const UpdateCountrySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().max(255).optional(),
  flagImage: z.string().optional().nullable(),
  currencyId: z.string().uuid().optional().nullable(),
  continentId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const CreateCurrencySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(10),
  symbol: z.string().max(10).optional().nullable(),
  decimalPlaces: z.number().int().min(0).max(4).optional().default(2),
  symbolPosition: z.enum(['before', 'after']).optional().default('before'),
  isDefault: z.boolean().optional().default(false),
  exchangeRate: z.number().optional().default(1),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const UpdateCurrencySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(10).optional(),
  symbol: z.string().max(10).optional().nullable(),
  decimalPlaces: z.number().int().min(0).max(4).optional(),
  symbolPosition: z.enum(['before', 'after']).optional(),
  isDefault: z.boolean().optional(),
  exchangeRate: z.number().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export class SettingsService {
  private countriesRepo = new CountriesRepository();
  private continentsRepo = new ContinentsRepository();
  private currenciesRepo = new CurrenciesRepository();

  async listCountries(options: {
    page?: number;
    limit?: number;
    search?: string;
    continentId?: string;
    isActive?: boolean;
    sort?: { column?: string; direction?: 'asc' | 'desc' };
  } = {}) {
    return this.countriesRepo.listWithContinent(options);
  }

  async listActiveCountries() {
    return this.countriesRepo.findActive();
  }

  async getCountry(id: string) {
    const country = await this.countriesRepo.findById(id);
    if (!country) throw new ValidationError('Country not found');
    return country;
  }

  async createCountry(data: z.infer<typeof CreateCountrySchema>) {
    const validated = CreateCountrySchema.parse(data);
    const slug = validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await this.countriesRepo.findBySlug(slug);
    if (existing) throw new ValidationError(`Country with slug "${slug}" already exists`);

    return this.countriesRepo.create({
      name: validated.name,
      slug,
      flagImage: validated.flagImage ?? null,
      currencyId: validated.currencyId ?? null,
      continentId: validated.continentId ?? null,
      isActive: validated.isActive ?? true,
      displayOrder: validated.displayOrder ?? 0,
    } as any);
  }

  async updateCountry(id: string, data: z.infer<typeof UpdateCountrySchema>) {
    const validated = UpdateCountrySchema.parse(data);
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.flagImage !== undefined) updateData.flagImage = validated.flagImage;
    if (validated.currencyId !== undefined) updateData.currencyId = validated.currencyId;
    if (validated.continentId !== undefined) updateData.continentId = validated.continentId;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.displayOrder !== undefined) updateData.displayOrder = validated.displayOrder;
    updateData.updatedAt = new Date();

    return this.countriesRepo.update(id, updateData as any);
  }

  async deleteCountry(id: string) {
    return this.countriesRepo.softDelete(id);
  }

  async restoreCountry(id: string) {
    return this.countriesRepo.update(id, { deletedAt: null, deletedBy: null } as any);
  }

  // ── Initialize Reference Data ──────────────────────────────────────────────
  // Idempotent: reads from src/data/reference/*.json, upserts into DB.
  // Never deletes records. Never overwrites admin customizations.

  async initializeReferenceData() {
    const importStart = Date.now();

    // Wrap entire import in a transaction for safety
    const result = await db.transaction(async (tx) => {
      let continentsCreated = 0;
      let currenciesCreated = 0;
      let countriesCreated = 0;
      let countriesUpdated = 0;
      let countriesSkipped = 0;

      // ── 1. Import Continents ─────────────────────────────────────────────
      const allContinents = await tx.select().from(continentsTable);
      const continentBySlug = new Map<string, { id: string; name: string }>();
      for (const c of allContinents as Array<{ id: string; name: string; slug: string }>) {
        continentBySlug.set(c.slug, { id: c.id, name: c.name });
      }

      for (const rc of continentsData) {
        if (!continentBySlug.has(rc.slug)) {
          const [created] = await tx.insert(continentsTable).values({
            name: rc.name,
            slug: rc.slug,
            isActive: true,
            displayOrder: 0,
          }).returning();
          continentBySlug.set(rc.slug, { id: created.id, name: rc.name });
          continentsCreated++;
        }
      }

      // ── 2. Import Currencies ─────────────────────────────────────────────
      const allCurrencies = await tx.select().from(currenciesTable);
      const currencyByCode = new Map<string, { id: string; code: string }>();
      for (const c of allCurrencies as Array<{ id: string; code: string }>) {
        currencyByCode.set(c.code, { id: c.id, code: c.code });
      }

      for (const rc of currenciesData) {
        if (!currencyByCode.has(rc.code)) {
          const insertValues = {
            code: rc.code,
            name: rc.name,
            symbol: rc.symbol,
            decimalPlaces: rc.decimalPlaces,
            symbolPosition: rc.symbolPosition as 'before' | 'after',
            isDefault: false,
            exchangeRate: '1',
            isActive: true,
            displayOrder: 0,
          } as const;
          const [created] = await tx.insert(currenciesTable).values(insertValues).returning();
          currencyByCode.set(rc.code, { id: created.id, code: rc.code });
          currenciesCreated++;
        }
      }

      // Auto-set first active currency as default if none exists
      const defaultCount = await tx.select({ count: sql<number>`count(*)::int` })
        .from(currenciesTable)
        .where(sql`${currenciesTable.isDefault} = true`);
      
      if (defaultCount[0].count === 0) {
        const firstCurrency = await tx.select().from(currenciesTable)
          .where(sql`${currenciesTable.isActive} = true`)
          .limit(1);
        
        if (firstCurrency.length > 0) {
          await tx.update(currenciesTable)
            .set({ isDefault: true })
            .where(sql`${currenciesTable.id} = ${firstCurrency[0].id}`);
        }
      }

      // ── 3. Import Countries ──────────────────────────────────────────────
      const allCountries = await tx.select().from(countriesTable);
      const existingBySlug = new Map(
        (allCountries as Array<{ id: string; slug: string; name: string; currencyId: string | null; continentId: string | null; flagImage: string | null; isActive: boolean; displayOrder: number }>)
          .map(c => [c.slug, c])
      );

      for (const rc of countriesData) {
        const continent = continentBySlug.get(rc.continentSlug);
        const currency = currencyByCode.get(rc.currencyCode);
        const continentId = continent?.id ?? null;
        const currencyId = currency?.id ?? null;

        const existing = existingBySlug.get(rc.slug);

        if (existing) {
          // UPSERT: Only update immutable reference fields.
          // NEVER overwrite: displayOrder, isActive, slug, flagImage, or any admin custom fields.
          const updateData: Record<string, unknown> = { updatedAt: new Date() };

          if (existing.name !== rc.name) updateData.name = rc.name;
          if (!existing.currencyId && currencyId) updateData.currencyId = currencyId;
          if (!existing.continentId && continentId) updateData.continentId = continentId;
          if (!existing.flagImage && rc.flagImage) updateData.flagImage = rc.flagImage;

          const hasChanges = Object.keys(updateData).length > 1;
          if (hasChanges) {
            await tx.update(countriesTable)
              .set(updateData as any)
              .where(sql`${countriesTable.id} = ${existing.id}`);
            countriesUpdated++;
          } else {
            countriesSkipped++;
          }
        } else {
          // CREATE: New country
          await tx.insert(countriesTable).values({
            name: rc.name,
            slug: rc.slug,
            flagImage: rc.flagImage,
            currencyId,
            continentId,
            isActive: true,
            displayOrder: 0,
          });
          countriesCreated++;
        }
      }

      return {
        continentsCreated,
        currenciesCreated,
        countriesCreated,
        countriesUpdated,
        countriesSkipped,
        total: countriesData.length,
      };
    });

    const durationMs = Date.now() - importStart;

    return {
      ...result,
      durationMs,
    };
  }

  // ── Continents ─────────────────────────────────────────────────────────────

  async listContinents() {
    return this.continentsRepo.findAll();
  }

  async listContinentsWithCount() {
    return this.continentsRepo.listWithCountryCount();
  }

  async listActiveContinents() {
    return this.continentsRepo.findActive();
  }

  async getContinent(id: string) {
    const continent = await this.continentsRepo.findById(id);
    if (!continent) throw new ValidationError('Continent not found');
    return continent;
  }

  async createContinent(data: z.infer<typeof CreateContinentSchema>) {
    const validated = CreateContinentSchema.parse(data);
    const slug = validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return this.continentsRepo.create({
      name: validated.name,
      slug,
      isActive: validated.isActive ?? true,
      displayOrder: validated.displayOrder ?? 0,
    } as any);
  }

  async updateContinent(id: string, data: z.infer<typeof UpdateContinentSchema>) {
    const validated = UpdateContinentSchema.parse(data);
    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.slug !== undefined) updateData.slug = validated.slug;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.displayOrder !== undefined) updateData.displayOrder = validated.displayOrder;
    updateData.updatedAt = new Date();
    return this.continentsRepo.update(id, updateData as any);
  }

  async deleteContinent(id: string) {
    return this.continentsRepo.softDelete(id);
  }

  async restoreContinent(id: string) {
    return this.continentsRepo.update(id, { deletedAt: null, deletedBy: null } as any);
  }

  // ── Currencies ─────────────────────────────────────────────────────────────

  async listCurrencies() {
    return this.currenciesRepo.findAll();
  }

  async listActiveCurrencies() {
    return this.currenciesRepo.findActive();
  }

  async getCurrency(id: string) {
    const currency = await this.currenciesRepo.findById(id);
    if (!currency) throw new ValidationError('Currency not found');
    return currency;
  }

  async createCurrency(data: z.infer<typeof CreateCurrencySchema>) {
    const validated = CreateCurrencySchema.parse(data);
    const existing = await this.currenciesRepo.findByCode(validated.code);
    if (existing) throw new ValidationError(`Currency with code "${validated.code}" already exists`);

    // If marking as default, unset all other defaults first
    if (validated.isDefault) {
      await this.currenciesRepo.setAllNotDefault();
    }

    return this.currenciesRepo.create({
      code: validated.code,
      name: validated.name,
      symbol: validated.symbol ?? null,
      decimalPlaces: validated.decimalPlaces ?? 2,
      symbolPosition: validated.symbolPosition ?? 'before',
      isDefault: validated.isDefault ?? false,
      exchangeRate: validated.exchangeRate ?? 1,
      isActive: validated.isActive ?? true,
      displayOrder: validated.displayOrder ?? 0,
    } as any);
  }

  async updateCurrency(id: string, data: z.infer<typeof UpdateCurrencySchema>) {
    const validated = UpdateCurrencySchema.parse(data);
    
    // Protect default currency from deactivation
    if (validated.isActive === false) {
      const existing = await this.currenciesRepo.findById(id);
      if (existing && (existing as { isDefault: boolean }).isDefault) {
        throw new ValidationError('Cannot deactivate the default currency. Set another currency as default first.');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.code !== undefined) updateData.code = validated.code;
    if (validated.symbol !== undefined) updateData.symbol = validated.symbol;
    if (validated.decimalPlaces !== undefined) updateData.decimalPlaces = validated.decimalPlaces;
    if (validated.symbolPosition !== undefined) updateData.symbolPosition = validated.symbolPosition;
    if (validated.isDefault !== undefined) {
      if (validated.isDefault) {
        await this.currenciesRepo.setAllNotDefault();
      }
      updateData.isDefault = validated.isDefault;
    }
    if (validated.exchangeRate !== undefined) {
      updateData.exchangeRate = validated.exchangeRate;
      updateData.lastUpdated = new Date();
    }
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.displayOrder !== undefined) updateData.displayOrder = validated.displayOrder;
    updateData.updatedAt = new Date();
    return this.currenciesRepo.update(id, updateData as any);
  }

  async deleteCurrency(id: string) {
    const currency = await this.currenciesRepo.findById(id);
    if (!currency) throw new ValidationError('Currency not found');
    if ((currency as { isDefault: boolean }).isDefault) {
      throw new ValidationError('Cannot delete the default currency. Set another currency as default first.');
    }
    return this.currenciesRepo.softDelete(id);
  }

  async restoreCurrency(id: string) {
    return this.currenciesRepo.update(id, { deletedAt: null, deletedBy: null } as any);
  }
}
