import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  message?: string,
  status = 200,
  headers?: HeadersInit
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      message,
    },
    { status, headers }
  );
}

export function apiError(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status = 500,
  details?: unknown,
  headers?: HeadersInit
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status, headers }
  );
}
