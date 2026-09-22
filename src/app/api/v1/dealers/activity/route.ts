import { DealerService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';

const dealerService = new DealerService();

export const POST = withAuth(async (req, auth) => {
  const body = await req.json();

  if (auth.role === 'dealer') {
    const dealer = await dealerService.getDealerByUserId(auth.userId);
    if (dealer) {
      body.dealerId = (dealer as { id: string }).id;
    }
  }

  const activity = await dealerService.logActivity(body);
  return apiSuccess(activity, undefined, 'Activity logged successfully', 201);
}, { roles: ['dealer', 'admin', 'super_admin'] });
