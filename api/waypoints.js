import { getDatabase } from './_utils/mongodb.js';
import { corsMiddleware } from './_utils/cors.js';
import { rateLimitMiddleware, RateLimitPresets } from './_utils/rateLimit.js';
import {
  sanitizeInput,
  validateString,
  validateCoordinates,
  validateEnum
} from './_utils/validation.js';
import { handleError, ValidationError } from './_utils/errorHandler.js';

// Serverless function handler for waypoints
export default async function handler(req, res) {
  // Handle CORS
  if (corsMiddleware(req, res)) {
    return; // OPTIONS request handled
  }

  try {
    // Handle GET request - Get waypoints for a user
    if (req.method === 'GET') {
      // Apply rate limiting (generous for GET requests)
      const rateLimit = rateLimitMiddleware(RateLimitPresets.READ)(req, res);
      if (rateLimit.rateLimited) {
        return res.status(rateLimit.response.status).json(rateLimit.response.body);
      }

      const { userId, username } = req.query;

      // Validate that at least one identifier is provided
      if (!userId && !username) {
        throw new ValidationError('userId or username is required');
      }

      // Build query based on provided identifier
      let query = {};
      if (userId) {
        const sanitizedUserId = validateString(userId, {
          minLength: 1,
          maxLength: 100,
          required: true
        });
        query.userId = sanitizedUserId;
      } else if (username) {
        const sanitizedUsername = validateString(username, {
          minLength: 1,
          maxLength: 100,
          required: true
        });
        query.username = sanitizedUsername;
      }

      // Connect to MongoDB
      const db = await getDatabase();
      const waypointsCollection = db.collection('waypoints');

      // Fetch waypoints belonging to this user
      // Use projection to limit returned fields (performance optimization)
      const waypoints = await waypointsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .project({
          // Include all fields for waypoints (they're not sensitive)
          // If we wanted to exclude: field: 0
        })
        .toArray();

      return res.json(waypoints);
    }

    // Handle POST request - Create a new waypoint
    else if (req.method === 'POST') {
      // Apply stricter rate limiting for POST requests
      const rateLimit = rateLimitMiddleware(RateLimitPresets.WRITE)(req, res);
      if (rateLimit.rateLimited) {
        return res.status(rateLimit.response.status).json(rateLimit.response.body);
      }

      // Sanitize input to prevent NoSQL injection
      const sanitizedBody = sanitizeInput(req.body);
      const { userId, imei, username, name, description, coordinates, type, metadata } = sanitizedBody;

      // Validate required fields
      const validatedUserId = validateString(userId, {
        minLength: 1,
        maxLength: 100,
        required: true
      });

      const validatedName = validateString(name, {
        minLength: 1,
        maxLength: 200,
        required: true
      });

      // Validate coordinates
      if (!coordinates) {
        throw new ValidationError('Coordinates are required');
      }

      const validatedCoordinates = validateCoordinates(coordinates);

      // Validate type
      const validTypes = ['port', 'anchorage', 'fishing_ground', 'favorite_spot', 'other'];
      const validatedType = validateEnum(type, validTypes, true);

      // Validate optional fields
      const validatedDescription = description
        ? validateString(description, { maxLength: 1000 })
        : null;

      const validatedImei = imei
        ? validateString(imei, { maxLength: 50 })
        : null;

      const validatedUsername = username
        ? validateString(username, { maxLength: 100 })
        : null;

      // Connect to MongoDB
      const db = await getDatabase();
      const waypointsCollection = db.collection('waypoints');
      const usersCollection = db.collection('users');

      // Get user information for username field (like catch-events pattern)
      const { ObjectId } = await import('mongodb');
      let user = null;
      try {
        user = await usersCollection.findOne({ _id: new ObjectId(validatedUserId) });
      } catch (err) {
        console.error('Error fetching user for waypoint:', err);
        // Continue without user data if lookup fails
      }

      // Create waypoint document
      const waypoint = {
        userId: validatedUserId,
        imei: validatedImei,
        username: validatedUsername || user?.username || null,
        name: validatedName,
        description: validatedDescription,
        coordinates: {
          lat: validatedCoordinates.lat,
          lng: validatedCoordinates.lng
        },
        type: validatedType,
        isPrivate: true,
        metadata: sanitizeInput(metadata) || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await waypointsCollection.insertOne(waypoint);
      const createdWaypoint = await waypointsCollection.findOne({ _id: result.insertedId });

      return res.status(201).json(createdWaypoint);
    }

    // Method not allowed for this route
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    handleError(res, error, {
      endpoint: '/api/waypoints',
      method: req.method,
      query: req.query,
      body: req.method === 'POST' ? sanitizeInput(req.body) : undefined
    });
  }
}
