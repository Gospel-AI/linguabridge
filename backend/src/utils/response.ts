import { Response } from 'express'

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    total?: number
    limit?: number
    offset?: number
    hasMore?: boolean
    [key: string]: unknown
  }
}

/**
 * HTTP Status codes
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Standard error codes
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
}

/**
 * Success response helper
 */
export function successResponse<T>(
  res: Response,
  data: T,
  statusCode: HttpStatus = HttpStatus.OK,
  meta?: ApiResponse['meta'],
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }

  if (meta) {
    response.meta = meta
  }

  res.status(statusCode).json(response)
}

/**
 * Created response helper (201)
 */
export function createdResponse<T>(res: Response, data: T): void {
  successResponse(res, data, HttpStatus.CREATED)
}

/**
 * No content response helper (204)
 */
export function noContentResponse(res: Response): void {
  res.status(HttpStatus.NO_CONTENT).send()
}

/**
 * Error response helper
 */
export function errorResponse(
  res: Response,
  statusCode: HttpStatus,
  errorCode: ErrorCode,
  message: string,
  details?: unknown,
): void {
  const error: ApiResponse['error'] = {
    code: errorCode,
    message,
  }

  if (details !== undefined) {
    error!.details = details
  }

  const response: ApiResponse = {
    success: false,
    error,
  }

  res.status(statusCode).json(response)
}

/**
 * Bad Request response (400)
 */
export function badRequestResponse(
  res: Response,
  message: string = 'Bad request',
  details?: unknown,
): void {
  errorResponse(res, HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, message, details)
}

/**
 * Validation Error response (400)
 */
export function validationErrorResponse(
  res: Response,
  message: string = 'Validation error',
  details?: unknown,
): void {
  errorResponse(res, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, message, details)
}

/**
 * Unauthorized response (401)
 */
export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized',
): void {
  errorResponse(res, HttpStatus.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR, message)
}

/**
 * Forbidden response (403)
 */
export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden',
): void {
  errorResponse(res, HttpStatus.FORBIDDEN, ErrorCode.AUTHORIZATION_ERROR, message)
}

/**
 * Not Found response (404)
 */
export function notFoundResponse(
  res: Response,
  message: string = 'Resource not found',
): void {
  errorResponse(res, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message)
}

/**
 * Conflict response (409)
 */
export function conflictResponse(
  res: Response,
  message: string = 'Resource conflict',
): void {
  errorResponse(res, HttpStatus.CONFLICT, ErrorCode.CONFLICT, message)
}

/**
 * Internal Server Error response (500)
 */
export function internalErrorResponse(
  res: Response,
  message: string = 'Internal server error',
): void {
  errorResponse(res, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, message)
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  total: number,
  limit: number,
  offset: number,
): void {
  successResponse(
    res,
    data,
    HttpStatus.OK,
    {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  )
}
