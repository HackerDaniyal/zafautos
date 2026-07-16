import { SettingsService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const settingsService = new SettingsService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { key } = await (context as { params: Promise<{ key: string }> }).params;
  const setting = await settingsService.getSystemSetting(key);
  return apiSuccess(setting);
});
