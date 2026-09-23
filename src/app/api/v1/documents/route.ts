import { DocumentService } from '@/server/services';
import { withErrorHandler } from '@/lib/api/errorHandler';
import { withAuth } from '@/lib/api/apiAuth';
import { apiSuccess } from '@/lib/api/response';
import { enforceRateLimit, getRateLimitIdentifierAuthenticated } from '@/lib/api/rateLimiter';

const documentService = new DocumentService();

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 1000;

export const POST = withAuth(async (req, auth) => {
  await enforceRateLimit('documents-create', getRateLimitIdentifierAuthenticated(auth.userId), RATE_LIMIT, RATE_WINDOW_MS);
  const body = await req.json();
  const document = await documentService.createDocument(body);
  return apiSuccess(document, undefined, 'Document created successfully', 201);
}, { permission: 'documents.create' });
