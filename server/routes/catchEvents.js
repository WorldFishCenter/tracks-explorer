import { Router } from 'express';
import { connectToMongo, ObjectId } from '../config/database.js';

const router = Router();

// Valid fish groups
const VALID_FISH_GROUPS = ['reef fish', 'sharks/rays', 'small pelagics', 'large pelagics', 'tuna/tuna-like'];

// Create catch event
router.post('/', async (req, res) => {
  try {
    const { tripId, date, fishGroup, quantity, photos, gps_photo, imei, username, catch_outcome } = req.body;

    console.log('Catch event request received:', { tripId, date, imei, username, catch_outcome, fishGroup, quantity });

    // Validate required fields - at least one identifier (imei or username) must be present
    const hasImei = imei && typeof imei === 'string' && imei.length > 0;
    const hasUsername = username && typeof username === 'string' && username.length > 0;

    if (!tripId || !date || catch_outcome === undefined || (!hasImei && !hasUsername)) {
      console.error('Validation failed:', { tripId: !!tripId, date: !!date, catch_outcome, hasImei, hasUsername });
      return res.status(400).json({ error: 'Missing required fields: tripId, date, (imei or username), catch_outcome' });
    }

    // Validate catch_outcome
    if (catch_outcome !== 0 && catch_outcome !== 1) {
      return res.status(400).json({ error: 'catch_outcome must be 0 (no catch) or 1 (has catch)' });
    }

    // For catch events (catch_outcome = 1), validate fishGroup and quantity
    if (catch_outcome === 1) {
      if (!fishGroup || !quantity) {
        return res.status(400).json({ error: 'fishGroup and quantity are required when catch_outcome = 1' });
      }

      // Validate fishGroup
      if (!VALID_FISH_GROUPS.includes(fishGroup)) {
        return res.status(400).json({ error: `Invalid fish group. Must be one of: ${VALID_FISH_GROUPS.join(', ')}` });
      }

      // Validate quantity
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number' });
      }
    }

    const userIdentifier = imei || username;
    console.log(`Creating catch event for trip ${tripId} by ${imei ? 'IMEI' : 'username'} ${userIdentifier}`);
    console.log('Request body contains GPS photo data:', !!gps_photo, gps_photo?.length || 0, 'coordinates');
    if (gps_photo && gps_photo.length > 0) {
      console.log('GPS coordinates received:', gps_photo);
    }

    // Connect to MongoDB
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB for catch event');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const catchEventsCollection = db.collection('catch-events');

    // Get user information for additional context
    const usersCollection = db.collection('users');
    let user = null;

    if (imei) {
      user = await usersCollection.findOne({ IMEI: imei });
    }

    // If no user found by IMEI, try finding by username (for non-PDS users)
    if (!user && username) {
      user = await usersCollection.findOne({ username: username });
    }

    // Detect if this is an admin user making a test submission
    const isAdminSubmission = req.body.isAdmin === true;

    console.log(`Admin submission detected: ${isAdminSubmission}`);

    // Create catch event document
    const catchEvent = {
      tripId,
      date: new Date(date),
      catch_outcome,
      imei: isAdminSubmission ? 'admin' : (imei || null),
      username: isAdminSubmission ? null : (username || null),
      boatName: isAdminSubmission ? 'admin' : (user?.Boat || user?.username || null),
      community: isAdminSubmission ? 'admin' : (user?.Community || null),
      reportedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(isAdminSubmission && { isAdminSubmission: true }),
      ...(catch_outcome === 1 && {
        fishGroup,
        quantity: parseFloat(quantity),
        photos: photos || [],
        gps_photo: gps_photo || []
      })
    };

    // Insert the catch event
    const result = await catchEventsCollection.insertOne(catchEvent);

    // Return the created document
    const createdEvent = await catchEventsCollection.findOne({ _id: result.insertedId });

    console.log(`Catch event created with ID: ${result.insertedId}`);
    res.status(201).json(createdEvent);
  } catch (error) {
    console.error('Error creating catch event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get catch events by trip ID
router.get('/trip/:tripId', async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    console.log(`Fetching catch events for trip ${tripId}`);

    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    const catchEventsCollection = db.collection('catch-events');
    const events = await catchEventsCollection.find({ tripId }).sort({ reportedAt: -1 }).toArray();

    res.json(events);
  } catch (error) {
    console.error('Error fetching catch events by trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get catch events by user identifier (IMEI or username)
router.get('/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({ error: 'User identifier (IMEI or username) is required' });
    }

    console.log(`Fetching catch events for user identifier ${identifier}`);

    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    const catchEventsCollection = db.collection('catch-events');
    // Query for either IMEI or username matching the identifier
    const events = await catchEventsCollection.find({
      $or: [
        { imei: identifier },
        { username: identifier }
      ]
    }).sort({ reportedAt: -1 }).toArray();

    res.json(events);
  } catch (error) {
    console.error('Error fetching catch events by user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
