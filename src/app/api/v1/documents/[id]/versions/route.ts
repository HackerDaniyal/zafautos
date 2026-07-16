import { DocumentService } from '@/server/services';
import { RequestContext, withErrorHandler } from '@/lib/api/errorHandler';
import { apiSuccess } from '@/lib/api/response';

const documentService = new DocumentService();

export const POST = withErrorHandler(async (req: Request, context?: RequestContext) => {
  const { id } = await (context as { params: Promise<{ id: string }> }).params;
  const body = await req.json();
  const version = await documentService.createDocumentVersion({ ...body, documentId: id });
  return apiSuccess(version, undefined, 'Document version created successfully', 201);
});
