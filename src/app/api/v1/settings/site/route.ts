import { SettingsService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const settingsService = new SettingsService();

export const PATCH = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const setting = await settingsService.updateSiteSetting(body);
  return apiSuccess(setting, undefined, 'Site setting updated successfully');
});
