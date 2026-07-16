import { DocumentService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const documentService = new DocumentService();

export const GET = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { vehicleId } = await (context as { params: Promise<{ vehicleId: string }> }).params;
  const documents = await documentService.getDocumentsByVehicleId(vehicleId);
  return apiSuccess(documents);
});
