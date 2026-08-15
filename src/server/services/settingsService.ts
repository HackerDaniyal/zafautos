import { CountriesRepository, ContinentsRepository, CurrenciesRepository, SiteSettingsRepository, TaxRatesRepository, EmailTemplatesRepository, NotificationRulesRepository, SystemSettingsRepository } from '@/server/repositories';
import { z } from 'zod';
import { ValidationError } from './errors';
import { db } from '@/server/db/client';
import { sql, eq, desc } from 'drizzle-orm';
import { continents as continentsTable, countries as countriesTable } from '@/server/db/schema/settings';
import { currencies as currenciesTable } from '@/server/db/schema/payments';
import { emailLogs } from '@/server/db/schema/messages';
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

export const UpdateSeoSchema = z.object({
  siteTitle: z.string().max(255).optional().nullable(),
  siteDescription: z.string().max(500).optional().nullable(),
  defaultKeywords: z.string().max(500).optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  ogTitle: z.string().max(255).optional().nullable(),
  ogDescription: z.string().max(500).optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  ogType: z.string().max(50).optional().nullable(),
  twitterCard: z.enum(['summary', 'summary_large_image']).optional().nullable(),
  twitterSite: z.string().max(100).optional().nullable(),
  twitterCreator: z.string().max(100).optional().nullable(),
  robotsIndex: z.boolean().optional(),
  robotsFollow: z.boolean().optional(),
  sitemapEnabled: z.boolean().optional(),
  faviconUrl: z.string().url().optional().nullable(),
});

export const UpdateCompanySchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255).optional(),
  companyEmail: z.string().email('Invalid email').optional().nullable(),
  companyPhone: z.string().max(50).optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional().nullable(),
  taxId: z.string().max(100).optional().nullable(),
  registrationNumber: z.string().max(100).optional().nullable(),
  logoUrl: z.string().url('Invalid URL').optional().nullable(),
  faviconUrl: z.string().url('Invalid URL').optional().nullable(),
});

export const CreateTaxRateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  countryId: z.string().uuid().optional().nullable(),
  rate: z.number().min(0, 'Rate must be positive').max(100),
  type: z.enum(['percentage', 'fixed']).optional().default('percentage'),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  displayOrder: z.number().int().optional().default(0),
});

export const UpdateTaxRateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  countryId: z.string().uuid().optional().nullable(),
  rate: z.number().min(0).max(100).optional(),
  type: z.enum(['percentage', 'fixed']).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export const CreateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  key: z.string().min(1, 'Key is required').max(100).regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  description: z.string().optional().nullable(),
  subject: z.string().max(255).optional().nullable(),
  body: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/).optional(),
  description: z.string().optional().nullable(),
  subject: z.string().max(255).optional().nullable(),
  body: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export class SettingsService {
  private countriesRepo = new CountriesRepository();
  private continentsRepo = new ContinentsRepository();
  private currenciesRepo = new CurrenciesRepository();
  private siteSettingsRepo = new SiteSettingsRepository();
  private taxRatesRepo = new TaxRatesRepository();
  private emailTemplatesRepo = new EmailTemplatesRepository();
  private notificationRulesRepo = new NotificationRulesRepository();
  private systemSettingsRepo = new SystemSettingsRepository();

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

  // ── Tax Rates ──────────────────────────────────────────────────────────────

  async listTaxRates() {
    return this.taxRatesRepo.listWithCountry();
  }

  async listActiveTaxRates() {
    return this.taxRatesRepo.findActive();
  }

  async getTaxRate(id: string) {
    const rate = await this.taxRatesRepo.findById(id);
    if (!rate) throw new ValidationError('Tax rate not found');
    return rate;
  }

  async createTaxRate(data: z.infer<typeof CreateTaxRateSchema>) {
    const validated = CreateTaxRateSchema.parse(data);

    if (validated.isDefault) {
      await this.taxRatesRepo.setAllNotDefault();
    }

    return this.taxRatesRepo.create({
      name: validated.name,
      countryId: validated.countryId ?? null,
      rate: String(validated.rate),
      type: validated.type ?? 'percentage',
      isDefault: validated.isDefault ?? false,
      isActive: validated.isActive ?? true,
      displayOrder: validated.displayOrder ?? 0,
    } as any);
  }

  async updateTaxRate(id: string, data: z.infer<typeof UpdateTaxRateSchema>) {
    const validated = UpdateTaxRateSchema.parse(data);

    if (validated.isActive === false) {
      const existing = await this.taxRatesRepo.findById(id);
      if (existing && (existing as { isDefault: boolean }).isDefault) {
        throw new ValidationError('Cannot deactivate the default tax rate. Set another rate as default first.');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.countryId !== undefined) updateData.countryId = validated.countryId;
    if (validated.rate !== undefined) updateData.rate = String(validated.rate);
    if (validated.type !== undefined) updateData.type = validated.type;
    if (validated.isDefault !== undefined) {
      if (validated.isDefault) {
        await this.taxRatesRepo.setAllNotDefault();
      }
      updateData.isDefault = validated.isDefault;
    }
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    if (validated.displayOrder !== undefined) updateData.displayOrder = validated.displayOrder;
    updateData.updatedAt = new Date();
    return this.taxRatesRepo.update(id, updateData as any);
  }

  async deleteTaxRate(id: string) {
    const rate = await this.taxRatesRepo.findById(id);
    if (!rate) throw new ValidationError('Tax rate not found');
    if ((rate as { isDefault: boolean }).isDefault) {
      throw new ValidationError('Cannot delete the default tax rate. Set another rate as default first.');
    }
    return this.taxRatesRepo.softDelete(id);
  }

  async restoreTaxRate(id: string) {
    return this.taxRatesRepo.update(id, { deletedAt: null, deletedBy: null } as any);
  }

  // ── Email Templates ────────────────────────────────────────────────────────

  async listEmailTemplates() {
    return this.emailTemplatesRepo.findAll();
  }

  async listActiveEmailTemplates() {
    return this.emailTemplatesRepo.findActive();
  }

  async getEmailTemplate(id: string) {
    const template = await this.emailTemplatesRepo.findById(id);
    if (!template) throw new ValidationError('Email template not found');
    return template;
  }

  async createEmailTemplate(data: z.infer<typeof CreateEmailTemplateSchema>) {
    const validated = CreateEmailTemplateSchema.parse(data);
    const existing = await this.emailTemplatesRepo.findByKey(validated.key);
    if (existing) throw new ValidationError(`Template with key "${validated.key}" already exists`);

    return this.emailTemplatesRepo.create({
      name: validated.name,
      key: validated.key,
      description: validated.description ?? null,
      subject: validated.subject ?? null,
      body: validated.body ?? null,
      isActive: validated.isActive ?? true,
    } as any);
  }

  async updateEmailTemplate(id: string, data: z.infer<typeof UpdateEmailTemplateSchema>) {
    const validated = UpdateEmailTemplateSchema.parse(data);

    if (validated.key) {
      const existing = await this.emailTemplatesRepo.findByKey(validated.key);
      if (existing && (existing as { id: string }).id !== id) {
        throw new ValidationError(`Template with key "${validated.key}" already exists`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.key !== undefined) updateData.key = validated.key;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.subject !== undefined) updateData.subject = validated.subject;
    if (validated.body !== undefined) updateData.body = validated.body;
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
    updateData.updatedAt = new Date();
    return this.emailTemplatesRepo.update(id, updateData as any);
  }

  async deleteEmailTemplate(id: string) {
    return this.emailTemplatesRepo.softDelete(id);
  }

  async restoreEmailTemplate(id: string) {
    return this.emailTemplatesRepo.update(id, { deletedAt: null, deletedBy: null } as any);
  }

  async listEmailLogs() {
    return db.select({
      id: emailLogs.id,
      recipient: emailLogs.recipient,
      templateId: emailLogs.templateId,
      subject: emailLogs.subject,
      content: emailLogs.content,
      status: emailLogs.status,
      errorMessage: emailLogs.errorMessage,
      sentAt: emailLogs.sentAt,
      createdAt: emailLogs.createdAt,
    })
      .from(emailLogs)
      .where(sql`${emailLogs.deletedAt} IS NULL`)
      .orderBy(desc(emailLogs.createdAt))
      .limit(200);
  }

  // ── Notification Rules ─────────────────────────────────────────────────────

  async listNotificationRules() {
    return this.notificationRulesRepo.findAll();
  }

  async getNotificationRule(id: string) {
    const rule = await this.notificationRulesRepo.findById(id);
    if (!rule) throw new ValidationError('Notification rule not found');
    return rule;
  }

  async seedDefaultNotificationRules() {
    const defaults = [
      { eventType: 'order.created', label: 'New Order Placed', description: 'When a customer places a new order', sendInApp: true, sendEmail: true },
      { eventType: 'order.confirmed', label: 'Order Confirmed', description: 'When an order is confirmed by admin', sendInApp: true, sendEmail: true },
      { eventType: 'order.shipped', label: 'Order Shipped', description: 'When an order is marked as shipped', sendInApp: true, sendEmail: true },
      { eventType: 'order.delivered', label: 'Order Delivered', description: 'When an order is delivered', sendInApp: true, sendEmail: true },
      { eventType: 'order.cancelled', label: 'Order Cancelled', description: 'When an order is cancelled', sendInApp: true, sendEmail: true },
      { eventType: 'payment.received', label: 'Payment Received', description: 'When a payment is received', sendInApp: true, sendEmail: true },
      { eventType: 'payment.failed', label: 'Payment Failed', description: 'When a payment fails', sendInApp: true, sendEmail: false },
      { eventType: 'payment.refunded', label: 'Payment Refunded', description: 'When a payment is refunded', sendInApp: true, sendEmail: true },
      { eventType: 'shipping.updated', label: 'Shipping Updated', description: 'When shipment status changes', sendInApp: true, sendEmail: false },
      { eventType: 'enquiry.received', label: 'New Enquiry', description: 'When a customer enquiry is received', sendInApp: true, sendEmail: true },
      { eventType: 'user.registered', label: 'New User Registration', description: 'When a new user registers', sendInApp: false, sendEmail: true },
      { eventType: 'user.invited', label: 'User Invited', description: 'When a user is invited', sendInApp: false, sendEmail: true },
    ];

    let created = 0;
    for (const d of defaults) {
      const existing = await this.notificationRulesRepo.findByEventType(d.eventType);
      if (!existing) {
        await this.notificationRulesRepo.create({
          eventType: d.eventType,
          label: d.label,
          description: d.description,
          isEnabled: true,
          sendInApp: d.sendInApp,
          sendEmail: d.sendEmail,
        } as any);
        created++;
      }
    }
    return { created };
  }

  async updateNotificationRule(id: string, data: { isEnabled?: boolean; sendInApp?: boolean; sendEmail?: boolean }) {
    const updateData: Record<string, unknown> = {};
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    if (data.sendInApp !== undefined) updateData.sendInApp = data.sendInApp;
    if (data.sendEmail !== undefined) updateData.sendEmail = data.sendEmail;
    updateData.updatedAt = new Date();
    return this.notificationRulesRepo.update(id, updateData as any);
  }

  async bulkUpdateNotificationRules(updates: Array<{ id: string; isEnabled?: boolean; sendInApp?: boolean; sendEmail?: boolean }>) {
    for (const u of updates) {
      await this.updateNotificationRule(u.id, u);
    }
  }

  // ── SEO Settings ───────────────────────────────────────────────────────────

  async getSeoSettings() {
    const record = await this.siteSettingsRepo.getByKey('seo');
    if (!record || !record.value) {
      return {
        siteTitle: null,
        siteDescription: null,
        defaultKeywords: null,
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        ogType: 'website',
        twitterCard: 'summary',
        twitterSite: null,
        twitterCreator: null,
        robotsIndex: true,
        robotsFollow: true,
        sitemapEnabled: true,
        faviconUrl: null,
      };
    }
    try {
      return JSON.parse(record.value);
    } catch {
      return null;
    }
  }

  async updateSeoSettings(data: z.infer<typeof UpdateSeoSchema>, userId?: string) {
    const validated = UpdateSeoSchema.parse(data);
    const current = await this.getSeoSettings() ?? {};
    const merged = { ...current, ...validated };
    const value = JSON.stringify(merged);
    return this.siteSettingsRepo.upsertByKey('seo', value, userId);
  }

  // ── Company Settings ───────────────────────────────────────────────────────

  async getCompanySettings() {
    const record = await this.siteSettingsRepo.getByKey('company');
    if (!record || !record.value) {
      return null;
    }
    try {
      return JSON.parse(record.value);
    } catch {
      return null;
    }
  }

  async updateCompanySettings(data: z.infer<typeof UpdateCompanySchema>, userId?: string) {
    const validated = UpdateCompanySchema.parse(data);
    const current = await this.getCompanySettings() ?? {};
    const merged = { ...current, ...validated };
    const value = JSON.stringify(merged);
    return this.siteSettingsRepo.upsertByKey('company', value, userId);
  }

  // ── Storage Settings ───────────────────────────────────────────────────────

  async getStorageOverview() {
    return [
      { name: 'vehicles', description: 'Vehicle images and media', publicAccess: true, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 10 },
      { name: 'documents', description: 'Vehicle and order documents', publicAccess: false, allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'], maxSizeMB: 20 },
      { name: 'media', description: 'General media content', publicAccess: true, allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'], maxSizeMB: 10 },
      { name: 'avatars', description: 'User profile avatars', publicAccess: true, allowedTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 5 },
      { name: 'flags', description: 'Country flag images', publicAccess: true, allowedTypes: ['image/svg+xml', 'image/png', 'image/webp'], maxSizeMB: 2 },
    ];
  }

  async getStorageConfig() {
    const record = await this.systemSettingsRepo.getByKey('storage');
    if (!record || !record.value) {
      return {
        maxFileSizeMB: 10,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
        cdnUrl: null,
        enableImageOptimization: true,
      };
    }
    try {
      return JSON.parse(record.value);
    } catch {
      return null;
    }
  }

  async updateStorageConfig(data: {
    maxFileSizeMB?: number;
    allowedMimeTypes?: string[];
    cdnUrl?: string;
    enableImageOptimization?: boolean;
  }, userId?: string) {
    const current = await this.getStorageConfig() ?? {};
    const merged = { ...current, ...data };
    const value = JSON.stringify(merged);
    return this.systemSettingsRepo.upsertByKey('storage', value, userId);
  }
}
