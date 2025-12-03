import { MongoClient, ObjectId } from 'mongodb';

// MongoDB Connection
// Remove quotes from MongoDB URI if present
const MONGODB_URI = process.env.MONGODB_URI
  ? process.env.MONGODB_URI.replace(/^"|"$/g, '')
  : '';

// Connect to MongoDB with better error handling
async function connectToMongo() {
  // Add validation for MongoDB URI
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  if (!MONGODB_URI.startsWith('mongodb://') && !MONGODB_URI.startsWith('mongodb+srv://')) {
    console.error('Invalid MongoDB URI format:', MONGODB_URI);
    throw new Error('Invalid MongoDB URI format. Must start with mongodb:// or mongodb+srv://');
  }

  const client = new MongoClient(MONGODB_URI, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });

  try {
    await client.connect();
    return { client, db: client.db('portal-dev') };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

// Serverless function handler for waypoints
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;

  try {
    // Handle GET request - Get waypoints for a user
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log(`Fetching waypoints for user: ${userId}`);

      // Connect to MongoDB
      const connection = await connectToMongo();
      client = connection.client;
      const db = connection.db;

      const waypointsCollection = db.collection('waypoints');

      // Fetch waypoints belonging to this user
      const waypoints = await waypointsCollection
        .find({
          userId: userId
        })
        .sort({ createdAt: -1 })
        .toArray();

      console.log(`Found ${waypoints.length} waypoints for user ${userId}`);

      // Close MongoDB connection
      await client.close();

      return res.json(waypoints);
    }

    // Handle POST request - Create a new waypoint
    else if (req.method === 'POST') {
      const { userId, imei, name, description, coordinates, type, metadata } = req.body;

      // Validate required fields
      if (!userId || !name || !coordinates || !type) {
        return res.status(400).json({ error: 'Missing required fields: userId, name, coordinates, type' });
      }

      // Validate coordinates
      if (!coordinates.lat || !coordinates.lng) {
        return res.status(400).json({ error: 'Coordinates must have lat and lng' });
      }

      // Validate type
      const validTypes = ['port', 'anchorage', 'fishing_ground', 'favorite_spot', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
      }

      console.log(`Creating waypoint "${name}" for user ${userId}`);

      // Connect to MongoDB
      const connection = await connectToMongo();
      client = connection.client;
      const db = connection.db;

      const waypointsCollection = db.collection('waypoints');

      // Create waypoint document
      const waypoint = {
        userId,
        imei: imei || null,
        name,
        description: description || null,
        coordinates: {
          lat: parseFloat(coordinates.lat),
          lng: parseFloat(coordinates.lng)
        },
        type,
        isPrivate: true,
        metadata: metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await waypointsCollection.insertOne(waypoint);
      const createdWaypoint = await waypointsCollection.findOne({ _id: result.insertedId });

      console.log(`Waypoint created with ID: ${result.insertedId}`);

      // Close MongoDB connection
      await client.close();

      return res.status(201).json(createdWaypoint);
    }

    // Method not allowed for this route
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in waypoints API:', error);

    // Ensure MongoDB connection is closed if there was an error
    if (client) {
      await client.close();
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
