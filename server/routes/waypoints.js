import { Router } from 'express';
import { connectToMongo, ObjectId } from '../config/database.js';

const router = Router();

// Valid waypoint types
const VALID_TYPES = ['port', 'anchorage', 'fishing_ground', 'favorite_spot', 'shallow_reef', 'other'];

/**
 * Helper to build userId query that handles both ObjectId and string formats
 * @param {string} userId - User ID (may be ObjectId string or plain string like 'admin')
 * @returns {ObjectId|string} Query value for userId
 */
function buildUserIdQuery(userId) {
  try {
    return new ObjectId(userId);
  } catch (err) {
    // If userId is not a valid ObjectId (e.g., 'admin'), use it as a string
    console.log(`userId is not a valid ObjectId, querying as string: ${userId}`);
    return userId;
  }
}

// Get waypoints for a user
router.get('/', async (req, res) => {
  try {
    const { userId, username, imei } = req.query;

    // Validate that at least one identifier is provided
    if (!userId && !username && !imei) {
      return res.status(400).json({ error: 'userId, username, or imei is required' });
    }

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const waypointsCollection = db.collection('waypoints');
    const usersCollection = db.collection('users');

    // Build query based on provided identifier
    // Always filter by isPrivate: true
    let query = { isPrivate: true };

    // Priority 1: Query by IMEI if provided (most reliable for PDS users)
    if (imei) {
      console.log(`Fetching waypoints for IMEI: ${imei}`);
      query.imei = imei;
    }
    // Priority 2: Query by userId, but first look up user's IMEI if available
    else if (userId) {
      console.log(`Fetching waypoints for userId: ${userId}`);

      // Try to find the user and use their IMEI for querying waypoints
      let user = null;
      try {
        const userIdQuery = buildUserIdQuery(userId);
        user = await usersCollection.findOne({ _id: userIdQuery });
      } catch (err) {
        console.log('Error looking up user:', err);
      }

      // If user found and has IMEI, query by IMEI (more reliable)
      if (user && user.IMEI) {
        console.log(`Found user with IMEI ${user.IMEI}, querying waypoints by IMEI`);
        query.imei = user.IMEI;
      }
      // Otherwise fall back to userId query
      else {
        query.userId = buildUserIdQuery(userId);
      }
    }
    // Priority 3: Query by username
    else if (username) {
      console.log(`Fetching waypoints for username: ${username}`);
      query.username = username;
    }

    // Fetch only waypoints belonging to this user and that are private
    const waypoints = await waypointsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Found ${waypoints.length} waypoints`);
    res.json(waypoints);
  } catch (error) {
    console.error('Error fetching waypoints:', error);
    // Return empty array instead of error if it's a collection/query issue
    if (error.message && error.message.includes('Collection')) {
      console.log('Waypoints collection does not exist yet, returning empty array');
      return res.json([]);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new waypoint
router.post('/', async (req, res) => {
  try {
    const { userId, imei, username, name, description, coordinates, type, metadata, isAdmin } = req.body;

    // Detect if this is an admin user making a test submission
    const isAdminSubmission = isAdmin === true;

    console.log(`Admin submission detected: ${isAdminSubmission}`);

    // Validate required fields
    if (!userId || !name || !coordinates || !coordinates.lat || !coordinates.lng || !type) {
      return res.status(400).json({ error: 'Missing required fields: userId, name, coordinates (lat, lng), type' });
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    // Validate coordinates
    if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ error: 'Coordinates must be numbers' });
    }

    if (coordinates.lat < -90 || coordinates.lat > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }

    if (coordinates.lng < -180 || coordinates.lng > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    console.log(`Creating waypoint "${name}" for user ${userId}`);

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const waypointsCollection = db.collection('waypoints');
    const usersCollection = db.collection('users');

    // Get user information for username field (like catch-events pattern)
    let user = null;
    let userIdForStorage = userId; // Store as-is by default

    try {
      // Try to convert userId to ObjectId for user lookup
      const objectIdUserId = new ObjectId(userId);
      user = await usersCollection.findOne({ _id: objectIdUserId });
      userIdForStorage = objectIdUserId; // Use ObjectId for storage if valid
    } catch (err) {
      console.error('Error fetching user for waypoint (userId not a valid ObjectId):', err);
      // userId is not a valid ObjectId (e.g., 'admin'), keep as string
      userIdForStorage = userId;
    }

    // Create waypoint document
    const waypoint = {
      userId: userIdForStorage,
      imei: isAdminSubmission ? 'admin' : (imei || null),
      username: username || user?.username || null,
      name,
      description: description || null,
      coordinates: {
        lat: coordinates.lat,
        lng: coordinates.lng
      },
      type,
      isPrivate: true,
      metadata: metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(isAdminSubmission && { isAdminSubmission: true })
    };

    const result = await waypointsCollection.insertOne(waypoint);
    const createdWaypoint = await waypointsCollection.findOne({ _id: result.insertedId });

    console.log(`Waypoint created with ID: ${result.insertedId}`);
    res.status(201).json(createdWaypoint);
  } catch (error) {
    console.error('Error creating waypoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a waypoint
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, name, description, coordinates, type } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`Updating waypoint ${id} for user ${userId}`);

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const waypointsCollection = db.collection('waypoints');
    const userIdQuery = buildUserIdQuery(userId);

    // Verify waypoint belongs to user before updating
    const existingWaypoint = await waypointsCollection.findOne({
      _id: new ObjectId(id),
      userId: userIdQuery
    });

    if (!existingWaypoint) {
      return res.status(404).json({ error: 'Waypoint not found or access denied' });
    }

    // Build update document
    const updateDoc = {
      $set: {
        updatedAt: new Date()
      }
    };

    if (name !== undefined) {
      updateDoc.$set.name = name;
    }

    if (description !== undefined) {
      updateDoc.$set.description = description;
    }

    if (coordinates !== undefined) {
      // Validate coordinates if provided
      if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
        return res.status(400).json({ error: 'Coordinates must be numbers' });
      }
      if (coordinates.lat < -90 || coordinates.lat > 90) {
        return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
      }
      if (coordinates.lng < -180 || coordinates.lng > 180) {
        return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
      }
      updateDoc.$set.coordinates = coordinates;
    }

    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }
      updateDoc.$set.type = type;
    }

    const result = await waypointsCollection.updateOne(
      { _id: new ObjectId(id), userId: userIdQuery },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Waypoint not found or access denied' });
    }

    const updatedWaypoint = await waypointsCollection.findOne({ _id: new ObjectId(id) });
    console.log(`Waypoint ${id} updated successfully`);
    res.json(updatedWaypoint);
  } catch (error) {
    console.error('Error updating waypoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a waypoint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log(`Deleting waypoint ${id} for user ${userId}`);

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const waypointsCollection = db.collection('waypoints');
    const userIdQuery = buildUserIdQuery(userId);

    // Delete only if waypoint belongs to user
    const result = await waypointsCollection.deleteOne({
      _id: new ObjectId(id),
      userId: userIdQuery
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Waypoint not found or access denied' });
    }

    console.log(`Waypoint ${id} deleted successfully`);
    res.json({ success: true, message: 'Waypoint deleted successfully' });
  } catch (error) {
    console.error('Error deleting waypoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
