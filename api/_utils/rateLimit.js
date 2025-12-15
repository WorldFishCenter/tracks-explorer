/**
 * Rate limiting utility for API endpoints
 * Simple in-memory rate limiting (for basic protection)
 * For production at scale, consider using Redis-based rate limiting
 */

// Store for rate limit data: { identifier: { count: number, resetTime: number } }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  // Strict limits for authentication endpoints
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },

  // Standard limits for POST/PUT/DELETE operations
  WRITE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please try again in a minute.'
  },

  // Generous limits for GET operations
  READ: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  }
};

/**
 * Check rate limit for a request
 *
 * @param {Object} req - Request object
 * @param {Object} config - Rate limit configuration
 * @param {number} config.maxRequests - Maximum requests allowed
 * @param {number} config.windowMs - Time window in milliseconds
 * @param {string} config.message - Error message to return
 * @returns {Object} - { allowed: boolean, retryAfter: number|null }
 */
export function checkRateLimit(req, config = RateLimitPresets.READ) {
  const { maxRequests, windowMs, message } = config;

  // Get identifier (IP address or user ID)
  const identifier = getClientIdentifier(req);

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // First request or window expired
  if (!record || record.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });

    return {
      allowed: true,
      retryAfter: null
    };
  }

  // Increment counter
  record.count++;

  // Check if limit exceeded
  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    return {
      allowed: false,
      retryAfter,
      message
    };
  }

  return {
    allowed: true,
    retryAfter: null
  };
}

/**
 * Rate limit middleware wrapper
 * Returns a function that checks rate limit and sends 429 response if exceeded
 *
 * @param {Object} config - Rate limit configuration
 * @returns {Function} - Middleware function
 */
export function rateLimitMiddleware(config = RateLimitPresets.READ) {
  return (req, res) => {
    const result = checkRateLimit(req, config);

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor((Date.now() + result.retryAfter * 1000) / 1000));

      return {
        rateLimited: true,
        response: {
          status: 429,
          body: {
            error: 'Too many requests',
            message: result.message,
            retryAfter: result.retryAfter
          }
        }
      };
    }

    // Set rate limit headers
    const identifier = getClientIdentifier(req);
    const record = rateLimitStore.get(identifier);

    if (record) {
      const remaining = Math.max(0, config.maxRequests - record.count);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.floor(record.resetTime / 1000));
    }

    return { rateLimited: false };
  };
}

/**
 * Get client identifier from request
 * Uses IP address from headers or socket
 *
 * @param {Object} req - Request object
 * @returns {string} - Client identifier
 */
function getClientIdentifier(req) {
  // Try to get real IP from proxy headers (Vercel, Cloudflare, etc.)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  // Fallback to socket IP
  const socketIp = req.socket?.remoteAddress;
  if (socketIp) {
    return socketIp;
  }

  // Last resort fallback
  return 'unknown';
}

/**
 * Clear rate limit for an identifier (useful for testing)
 *
 * @param {string} identifier - Client identifier
 */
export function clearRateLimit(identifier) {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit info for an identifier
 *
 * @param {Object} req - Request object
 * @returns {Object} - { count: number, resetTime: number, remaining: number }
 */
export function getRateLimitInfo(req) {
  const identifier = getClientIdentifier(req);
  const record = rateLimitStore.get(identifier);

  if (!record) {
    return null;
  }

  return {
    count: record.count,
    resetTime: record.resetTime,
    remaining: Math.max(0, RateLimitPresets.READ.maxRequests - record.count)
  };
}
