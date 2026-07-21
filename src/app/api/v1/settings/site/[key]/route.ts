import { SettingsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const settingsService = new SettingsService();

export const GET = withErrorHandler(async () => {
  const languages = await settingsService.getLanguages();
  return apiSuccess(languages);
});
