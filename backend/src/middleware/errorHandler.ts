import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/errors'
import { errorResponse, HttpStatus, ErrorCode } from '../utils/response'
import { logger } from '../utils/logger'

/**
 * Error handler middleware
 *
 * Catches all errors thrown in controllers and formats them consistently
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log error
  logger.errorWithException('Request error', err, {
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  })

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }))

    return errorResponse(
      res,
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      'Invalid request data',
      details,
    )
  }

  // Handle ApiError (custom errors)
  if (err instanceof ApiError) {
    return errorResponse(
      res,
      err.statusCode,
      err.errorCode,
      err.message,
      err.details,
    )
  }

  // Handle unknown errors
  // In production, don't expose internal error details
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message

  errorResponse(
    res,
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_ERROR,
    message,
  )
}

/**
 * Async handler wrapper
 *
 * Wraps async route handlers to catch errors and pass them to error handler
 */
export function asyncHandler(
  fn: (_req: Request, _res: Response, _next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * Not found handler
 *
 * Handles requests to non-existent routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  errorResponse(
    res,
    HttpStatus.NOT_FOUND,
    ErrorCode.NOT_FOUND,
    `Route ${req.method} ${req.path} not found`,
  )
}
