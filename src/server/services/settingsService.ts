import { BaseRepository } from '@/server/repositories';
import { countries, languages, siteSettings, systemSettings } from '@/server/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { SettingNotFoundError, ValidationError } from './errors';

// ─────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────

export const UpdateSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string().optional().nullable(),
});
export type UpdateSettingDTO = z.infer<typeof UpdateSettingSchema>;

// ─────────────────────────────────────────────
// Service Layer
// ─────────────────────────────────────────────

export class SettingsService {
  private siteSettingsRepo = new BaseRepository(siteSettings);
  private systemSettingsRepo = new BaseRepository(systemSettings);
  private countriesRepo = new BaseRepository(countries);
  private languagesRepo = new BaseRepository(languages);

  /**
   * Retrieves all countries.
   */
  async getCountries() {
    return this.countriesRepo.findAll();
  }

  /**
   * Retrieves all languages.
   */
  async getLanguages() {
    return this.languagesRepo.findAll();
  }

  /**
   * Retrieves a site setting by key.
   */
  async getSiteSetting(key: string) {
    if (!key) {
      throw new ValidationError('Setting key is required');
    }
    
    const [setting] = await this.siteSettingsRepo.getClient()
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key))
      .limit(1);

    if (!setting) {
      throw new SettingNotFoundError(key);
    }

    return setting;
  }

  /**
   * Updates a site setting.
   */
  async updateSiteSetting(data: UpdateSettingDTO) {
    const validatedData = UpdateSettingSchema.parse(data);

    // Try to update existing or insert if not exists.
    // Drizzle ORM requires explicit onConflictDoUpdate or similar for upserts,
    // For simplicity with existing base structure, we'll try to find first.
    
    const [existing] = await this.siteSettingsRepo.getClient()
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, validatedData.key))
      .limit(1);

    if (existing) {
       return this.siteSettingsRepo.update(
           existing.id, 
           { value: validatedData.value } as unknown as Parameters<typeof this.siteSettingsRepo.update>[1]
       );
    } else {
       return this.siteSettingsRepo.create({
           key: validatedData.key,
           value: validatedData.value,
       } as unknown as Parameters<typeof this.siteSettingsRepo.create>[0]);
    }
  }

  /**
   * Retrieves a system setting by key.
   */
  async getSystemSetting(key: string) {
    if (!key) {
      throw new ValidationError('Setting key is required');
    }

    const [setting] = await this.systemSettingsRepo.getClient()
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (!setting) {
      throw new SettingNotFoundError(key);
    }

    return setting;
  }
}
