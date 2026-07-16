import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DomainError } from '@/server/services/errors';
import { apiError } from './response';

export type RequestContext = { params: Promise<Record<string, string | string[]>> } | unknown;
export type RequestHandler = (req: Request, context?: RequestContext) => Promise<NextResponse>;

export function withErrorHandler(handler: RequestHandler): RequestHandler {
  return async (req: Request, context?: RequestContext) => {
    // Generate a simple request ID for tracing
    const requestId = crypto.randomUUID();
    
    try {
      const response = await handler(req, context);
      // Attach x-request-id to successful responses
      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      console.error(`[API Error | Request ID: ${requestId}]`, error);

      const headers = new Headers();
      headers.set('x-request-id', requestId);

      if (error instanceof ZodError) {
        return apiError(
          'Validation failed',
          'VALIDATION_ERROR',
          422,
          error.errors,
          headers
        );
      }

      if (error instanceof DomainError) {
        let status = 400; // Default Bad Request
        
        switch (error.code) {
          case 'USER_NOT_FOUND':
          case 'VEHICLE_NOT_FOUND':
          case 'ORDER_NOT_FOUND':
          case 'CUSTOMER_NOT_FOUND':
          case 'DEALER_NOT_FOUND':
          case 'PAYMENT_NOT_FOUND':
          case 'SHIPMENT_NOT_FOUND':
          case 'DOCUMENT_NOT_FOUND':
          case 'SETTING_NOT_FOUND':
            status = 404;
            break;
            
          case 'UNAUTHORIZED':
            status = 403; // Or 401 if not authenticated
            break;
            
          case 'SESSION_EXPIRED':
          case 'INVALID_CREDENTIALS':
            status = 401;
            break;

          case 'USER_ALREADY_EXISTS':
          case 'VEHICLE_ALREADY_EXISTS':
          case 'DUPLICATE_PAYMENT':
          case 'CONFLICT':
            status = 409;
            break;
            
          case 'RATE_LIMIT_EXCEEDED':
            status = 429;
            break;

          case 'VALIDATION_ERROR':
          case 'VEHICLE_NOT_AVAILABLE':
          case 'INVALID_ORDER_STATUS_TRANSITION':
          case 'ORDER_ALREADY_CANCELLED':
            status = 400;
            break;
        }

        return apiError(error.message, error.code, status, undefined, headers);
      }

      // Fallback internal server error
      return apiError(
        'Internal Server Error',
        'INTERNAL_ERROR',
        500,
        process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
        headers
      );
    }
  };
}
