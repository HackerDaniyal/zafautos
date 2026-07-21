import { SiteSettingsRepository, SystemSettingsRepository, CountriesRepository, LanguagesRepository } from '@/server/repositories';
import { z } from 'zod';
import { SettingNotFoundError, ValidationError } from './errors';

export const UpdateSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string().optional().nullable(),
});
export type UpdateSettingDTO = z.infer<typeof UpdateSettingSchema>;

export class SettingsService {
  private siteSettingsRepo = new SiteSettingsRepository();
  private systemSettingsRepo = new SystemSettingsRepository();
  private countriesRepo = new CountriesRepository();
  private languagesRepo = new LanguagesRepository();

  async getCountries() {
    return this.countriesRepo.findAll();
  }

  async getLanguages() {
    return this.languagesRepo.findAll();
  }

  async getSiteSetting(key: string) {
    if (!key) {
      throw new ValidationError('Setting key is required');
    }

    const setting = await this.siteSettingsRepo.findByField('key', key);
    if (!setting) {
      throw new SettingNotFoundError(key);
    }
    return setting;
  }

  async updateSiteSetting(data: UpdateSettingDTO) {
    const validatedData = UpdateSettingSchema.parse(data);

    const existing = await this.siteSettingsRepo.findByField('key', validatedData.key);

    if (existing) {
      return this.siteSettingsRepo.update(
        (existing as { id: string }).id,
        { value: validatedData.value } as Parameters<typeof this.siteSettingsRepo.update>[1]
      );
    } else {
      return this.siteSettingsRepo.create({
        key: validatedData.key,
        value: validatedData.value,
      } as Parameters<typeof this.siteSettingsRepo.create>[0]);
    }
  }

  async getSystemSetting(key: string) {
    if (!key) {
      throw new ValidationError('Setting key is required');
    }

    const setting = await this.systemSettingsRepo.findByField('key', key);
    if (!setting) {
      throw new SettingNotFoundError(key);
    }
    return setting;
  }
}
