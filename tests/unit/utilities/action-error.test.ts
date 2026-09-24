import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { handleError } from '@/lib/errors/action-error';
import { DomainError, UserNotFoundError } from '@/server/services/errors';

describe('handleError', () => {
  it('returns VALIDATION_ERROR code for ZodError', () => {
    const zodError = new ZodError([
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'], message: 'Expected string, received number' },
    ]);
    const result = handleError(zodError);

    expect(result).toEqual({
      success: false,
      error: 'Expected string, received number',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns multiple ZodError messages joined by comma', () => {
    const zodError = new ZodError([
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'], message: 'Name is required' },
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['email'], message: 'Email is invalid' },
    ]);
    const result = handleError(zodError);

    expect(result.error).toBe('Name is required, Email is invalid');
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('returns DomainError message and code', () => {
    const error = new DomainError('Something failed', 'CUSTOM_CODE');
    const result = handleError(error);

    expect(result).toEqual({
      success: false,
      error: 'Something failed',
      code: 'CUSTOM_CODE',
    });
  });

  it('returns specific DomainError subclass code', () => {
    const error = new UserNotFoundError('user-42');
    const result = handleError(error);

    expect(result).toEqual({
      success: false,
      error: 'User not found: user-42',
      code: 'USER_NOT_FOUND',
    });
  });

  it('does not leak generic Error messages outside development', () => {
    const prev = process.env.NODE_ENV;
    // Vitest sets NODE_ENV=test; treat non-development as production-like.
    const error = new Error('Something broke');
    const result = handleError(error);

    expect(result.code).toBe('INTERNAL_ERROR');
    expect(result.success).toBe(false);
    // NODE_ENV is 'test' (not 'development') → generic message
    expect(result.error).toBe('An unexpected error occurred');
    expect(result.error).not.toContain('Something broke');
    expect(prev).toBeDefined();
  });

  it('returns raw Error message only in development', () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error test-only mutation
    process.env.NODE_ENV = 'development';
    try {
      const result = handleError(new Error('dev detail'));
      expect(result).toEqual({
        success: false,
        error: 'dev detail',
        code: 'INTERNAL_ERROR',
      });
    } finally {
      // @ts-expect-error test-only mutation
      process.env.NODE_ENV = original;
    }
  });

  it('returns INTERNAL_ERROR for unknown error', () => {
    const result = handleError('a string error');

    expect(result).toEqual({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  });

  it('returns INTERNAL_ERROR for null error', () => {
    const result = handleError(null);

    expect(result).toEqual({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  });

  it('returns INTERNAL_ERROR for undefined error', () => {
    const result = handleError(undefined);

    expect(result).toEqual({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    });
  });

  it('always returns success: false', () => {
    expect(handleError(new Error('')).success).toBe(false);
    expect(handleError(new DomainError('', '')).success).toBe(false);
    expect(handleError(new ZodError([])).success).toBe(false);
    expect(handleError('unknown').success).toBe(false);
  });
});
