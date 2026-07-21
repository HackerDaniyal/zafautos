import { BaseRepository } from './baseRepository';
import { countries, languages, siteSettings, systemSettings } from '@/server/db/schema';

export class SiteSettingsRepository extends BaseRepository<typeof siteSettings> {
  constructor() {
    super(siteSettings);
  }
}

export class SystemSettingsRepository extends BaseRepository<typeof systemSettings> {
  constructor() {
    super(systemSettings);
  }
}

export class CountriesRepository extends BaseRepository<typeof countries> {
  constructor() {
    super(countries);
  }
}

export class LanguagesRepository extends BaseRepository<typeof languages> {
  constructor() {
    super(languages);
  }
}
