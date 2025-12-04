import { ErrorCode, HttpStatus } from './response'

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatus
  public readonly errorCode: ErrorCode
  public readonly details?: unknown
  public readonly isOperational: boolean

  constructor(
    statusCode: HttpStatus,
    errorCode: ErrorCode,
    message: string,
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message)

    this.statusCode = statusCode
    this.errorCode = errorCode
    this.details = details
    this.isOperational = isOperational

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)

    // Set the prototype explicitly
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(HttpStatus.BAD_REQUEST, ErrorCode.BAD_REQUEST, message, details)
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends ApiError {
  constructor(message: string = 'Validation error', details?: unknown) {
    super(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, message, details)
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(HttpStatus.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR, message)
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(HttpStatus.FORBIDDEN, ErrorCode.AUTHORIZATION_ERROR, message)
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, message)
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(HttpStatus.CONFLICT, ErrorCode.CONFLICT, message)
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalError extends ApiError {
  constructor(message: string = 'Internal server error', details?: unknown) {
    super(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCode.INTERNAL_ERROR, message, details)
  }
}

/**
 * Check if error is an operational error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof ApiError) {
    return error.isOperational
  }
  return false
}
