import { DocumentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const documentService = new DocumentService();

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const document = await documentService.createDocument(body);
  return apiSuccess(document, undefined, 'Document created successfully', 201);
});
