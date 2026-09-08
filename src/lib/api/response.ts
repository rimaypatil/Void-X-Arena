import { NextResponse } from 'next/server';
import { ApiError, ErrorCode, ErrorCodes } from './errors';

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
    [key: string]: unknown;
  };
}

export interface ApiResponseError {
  success: false;
  error: ApiError;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export class Api {
  static success<T>(data: T, meta?: ApiResponseSuccess<T>['meta'], status = 200) {
    const payload: ApiResponseSuccess<T> = {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    };
    return NextResponse.json(payload, { status });
  }

  static error(code: ErrorCode, message: string, details?: unknown, status = 400) {
    const payload: ApiResponseError = {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };
    return NextResponse.json(payload, { status });
  }

  static unauthorized(message = 'Authentication required', details?: unknown) {
    return this.error(ErrorCodes.UNAUTHORIZED, message, details, 401);
  }

  static forbidden(message = 'Access forbidden', details?: unknown) {
    return this.error(ErrorCodes.FORBIDDEN, message, details, 403);
  }

  static notFound(message = 'Resource not found', code: ErrorCode = ErrorCodes.MATCH_NOT_FOUND) {
    return this.error(code, message, undefined, 404);
  }

  static serverError(message = 'Internal server error occurred', details?: unknown) {
    return this.error(ErrorCodes.INTERNAL_SERVER_ERROR, message, details, 500);
  }

  static validationError(message = 'Invalid request payload', details?: unknown) {
    return this.error(ErrorCodes.VALIDATION_ERROR, message, details, 422);
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return this.error(ErrorCodes.VALIDATION_ERROR, message, details, 400);
  }
}
