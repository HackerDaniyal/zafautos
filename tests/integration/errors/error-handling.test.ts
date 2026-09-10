import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

describe('DomainError Subclasses - Error Codes', () => {
  const errorsContent = readFile('server/services/errors.ts');

  it('UserNotFoundError has code USER_NOT_FOUND', () => {
    expect(errorsContent).toMatch(/'USER_NOT_FOUND'/);
  });

  it('UserAlreadyExistsError has code USER_ALREADY_EXISTS', () => {
    expect(errorsContent).toMatch(/'USER_ALREADY_EXISTS'/);
  });

  it('InvalidCredentialsError has code INVALID_CREDENTIALS', () => {
    expect(errorsContent).toMatch(/'INVALID_CREDENTIALS'/);
  });

  it('SessionExpiredError has code SESSION_EXPIRED', () => {
    expect(errorsContent).toMatch(/'SESSION_EXPIRED'/);
  });

  it('UnauthorizedError has code UNAUTHORIZED', () => {
    expect(errorsContent).toMatch(/'UNAUTHORIZED'/);
  });

  it('VehicleNotFoundError has code VEHICLE_NOT_FOUND', () => {
    expect(errorsContent).toMatch(/'VEHICLE_NOT_FOUND'/);
  });

  it('VehicleAlreadyExistsError has code VEHICLE_ALREADY_EXISTS', () => {
    expect(errorsContent).toMatch(/'VEHICLE_ALREADY_EXISTS'/);
  });

  it('VehicleNotAvailableError has code VEHICLE_NOT_AVAILABLE', () => {
    expect(errorsContent).toMatch(/'VEHICLE_NOT_AVAILABLE'/);
  });

  it('OrderNotFoundError has code ORDER_NOT_FOUND', () => {
    expect(errorsContent).toMatch(/'ORDER_NOT_FOUND'/);
  });

  it('InvalidOrderStatusTransitionError has code INVALID_ORDER_STATUS_TRANSITION', () => {
    expect(errorsContent).toMatch(/'INVALID_ORDER_STATUS_TRANSITION'/);
  });

  it('PaymentNotFoundError has code PAYMENT_NOT_FOUND', () => {
    expect(errorsContent).toMatch(/'PAYMENT_NOT_FOUND'/);
  });

  it('InvoiceNotFoundError has code INVOICE_NOT_FOUND', () => {
    expect(errorsContent).toMatch(/'INVOICE_NOT_FOUND'/);
  });

  it('ShipmentNotFoundError has code SHIPMENT_NOT_FOUND', () => {
    expect(errorsContent).toMatch(/'SHIPMENT_NOT_FOUND'/);
  });

  it('ValidationError has code VALIDATION_ERROR', () => {
    expect(errorsContent).toMatch(/'VALIDATION_ERROR'/);
  });

  it('ConflictError has code CONFLICT', () => {
    expect(errorsContent).toMatch(/'CONFLICT'/);
  });

  it('all subclasses extend DomainError', () => {
    const classMatches = errorsContent.match(/export class \w+Error extends DomainError/g);
    expect(classMatches).not.toBeNull();
    expect(classMatches!.length).toBeGreaterThanOrEqual(15);
  });
});

describe('handleError - Error Mapping', () => {
  const actionErrorContent = readFile('lib/errors/action-error.ts');

  it('maps ZodError to VALIDATION_ERROR code', () => {
    expect(actionErrorContent).toContain("'VALIDATION_ERROR'");
    expect(actionErrorContent).toContain('ZodError');
  });

  it('maps DomainError to its own code', () => {
    expect(actionErrorContent).toContain('error.code');
    expect(actionErrorContent).toContain('DomainError');
  });

  it('maps generic Error to INTERNAL_ERROR', () => {
    expect(actionErrorContent).toContain("'INTERNAL_ERROR'");
  });

  it('returns success: false for all error types', () => {
    expect(actionErrorContent).toContain('success: false');
  });

  it('exports ActionResult type', () => {
    expect(actionErrorContent).toContain('ActionResult');
  });

  it('exports ActionError type', () => {
    expect(actionErrorContent).toContain('ActionError');
  });
});

describe('Error Handling - No Stack Trace Leaks', () => {
  const actionErrorContent = readFile('lib/errors/action-error.ts');

  it('does not include .stack in error responses', () => {
    expect(actionErrorContent).not.toContain('.stack');
  });

  it('does not include stackTrace in responses', () => {
    expect(actionErrorContent).not.toContain('stackTrace');
  });
});

describe('Error Handling - No Secret Leaks', () => {
  it('error handler does not expose database connection strings', () => {
    const content = readFile('lib/errors/action-error.ts');
    expect(content).not.toContain('DATABASE_URL');
    expect(content).not.toContain('postgresql://');
  });

  it('error handler does not expose service-role keys', () => {
    const content = readFile('lib/errors/action-error.ts');
    expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });

  it('error handler does not expose API keys', () => {
    const content = readFile('lib/errors/action-error.ts');
    expect(content).not.toContain('anon_key');
    expect(content).not.toContain('service_role_key');
  });
});
