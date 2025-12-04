/**
 * CORS (Cross-Origin Resource Sharing) utility
 * Standardizes CORS headers across all API endpoints
 */

/**
 * Get allowed origins based on environment
 * @returns {string|string[]} - Allowed origin(s)
 */
function getAllowedOrigins() {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    // In production, use specific origins from environment variable
    const allowedOrigins = process.env.ALLOWED_ORIGINS;

    if (allowedOrigins) {
      // Parse comma-separated list of origins
      return allowedOrigins.split(',').map(origin => origin.trim());
    }

    // Fallback: allow Vercel deployment URL
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
      return [`https://${vercelUrl}`];
    }

    // If no specific origins configured, log warning and allow all (not recommended)
    console.warn('ALLOWED_ORIGINS not configured in production. Using wildcard (*).');
    return '*';
  }

  // Development: allow all origins
  return '*';
}

/**
 * Set CORS headers on response
 *
 * @param {Object} res - Response object
 * @param {Object} req - Request object (optional, for origin checking)
 */
export function setCorsHeaders(res, req = null) {
  const allowedOrigins = getAllowedOrigins();

  // Handle wildcard or specific origins
  if (allowedOrigins === '*') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (Array.isArray(allowedOrigins) && req) {
    // Check if request origin is in allowed list
    const requestOrigin = req.headers.origin;

    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    } else {
      // Origin not allowed, don't set CORS header
      // Request will be blocked by browser
      console.warn(`Origin not allowed: ${requestOrigin}`);
    }
  }

  // Standard CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * Handle preflight OPTIONS request
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} - True if OPTIONS request was handled
 */
export function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, req);
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * CORS middleware - sets headers and handles preflight
 *
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {boolean} - True if request was handled (OPTIONS), false to continue
 */
export function corsMiddleware(req, res) {
  // Set CORS headers
  setCorsHeaders(res, req);

  // Handle preflight
  return handlePreflight(req, res);
}
