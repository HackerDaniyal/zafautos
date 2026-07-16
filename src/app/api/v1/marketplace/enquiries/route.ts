import { MarketplaceService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const marketplaceService = new MarketplaceService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const enquiry = await marketplaceService.submitEnquiry(body);
  return apiSuccess(enquiry, undefined, 'Enquiry submitted successfully', 201);
});
