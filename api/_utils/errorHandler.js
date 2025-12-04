/**
 * Error handling utility for API endpoints
 * Provides consistent error responses and logging
 */

/**
 * Log error to console and external service (if configured)
 *
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function logError(error, context = {}) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };

  // Log to console
  console.error('API Error:', JSON.stringify(errorInfo, null, 2));

  // TODO: Send to external error monitoring service (Sentry, etc.)
  // if (process.env.SENTRY_DSN) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Create standardized error response
 *
 * @param {string} message - User-friendly error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code (optional)
 * @param {Object} details - Additional details (optional, dev only)
 * @returns {Object} - Error response object
 */
export function createErrorResponse(message, statusCode = 500, code = null, details = null) {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  return {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(isDevelopment && details && { details })
    }
  };
}

/**
 * Handle error and send response
 *
 * @param {Object} res - Response object
 * @param {Error} error - Error object
 * @param {Object} context - Additional context for logging
 * @param {number} defaultStatus - Default HTTP status code
 */
export function handleError(res, error, context = {}, defaultStatus = 500) {
  // Log error
  logError(error, context);

  // Determine status code
  let statusCode = defaultStatus;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Handle known error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'MongoServerError') {
    // MongoDB errors
    if (error.code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
      code = 'DUPLICATE_ERROR';
    } else {
      statusCode = 500;
      message = 'Database error';
      code = 'DATABASE_ERROR';
    }
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = error.message;
    code = 'NOT_FOUND';
  } else if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
    statusCode = 401;
    message = error.message;
    code = 'UNAUTHORIZED';
  } else if (error.message.includes('forbidden') || error.message.includes('access denied')) {
    statusCode = 403;
    message = error.message;
    code = 'FORBIDDEN';
  }

  // Send error response
  res.status(statusCode).json(
    createErrorResponse(message, statusCode, code, error.stack)
  );
}

/**
 * Async handler wrapper - catches errors and passes to error handler
 *
 * @param {Function} handler - Async handler function
 * @returns {Function} - Wrapped handler
 */
export function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleError(res, error, {
        url: req.url,
        method: req.method,
        body: req.body,
        query: req.query
      });
    }
  };
}

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized error class
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error class
 */
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
