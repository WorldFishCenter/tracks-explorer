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

// Serverless function handler for individual waypoint operations
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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Waypoint ID is required' });
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid waypoint ID format' });
  }

  let client;

  try {
    // Handle PUT request - Update a waypoint
    if (req.method === 'PUT') {
      const { userId, name, description, coordinates, type } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log(`Updating waypoint ${id} for user ${userId}`);

      // Connect to MongoDB
      const connection = await connectToMongo();
      client = connection.client;
      const db = connection.db;

      const waypointsCollection = db.collection('waypoints');

      // Verify waypoint belongs to user before updating
      const existingWaypoint = await waypointsCollection.findOne({
        _id: new ObjectId(id),
        userId: userId
      });

      if (!existingWaypoint) {
        await client.close();
        return res.status(404).json({ error: 'Waypoint not found or access denied' });
      }

      // Build update object
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
        // Validate coordinates
        if (!coordinates.lat || !coordinates.lng) {
          await client.close();
          return res.status(400).json({ error: 'Coordinates must have lat and lng' });
        }
        updateDoc.$set.coordinates = {
          lat: parseFloat(coordinates.lat),
          lng: parseFloat(coordinates.lng)
        };
      }

      if (type !== undefined) {
        // Validate type
        const validTypes = ['port', 'anchorage', 'fishing_ground', 'favorite_spot', 'other'];
        if (!validTypes.includes(type)) {
          await client.close();
          return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        }
        updateDoc.$set.type = type;
      }

      const result = await waypointsCollection.updateOne(
        { _id: new ObjectId(id), userId: userId },
        updateDoc
      );

      if (result.matchedCount === 0) {
        await client.close();
        return res.status(404).json({ error: 'Waypoint not found or access denied' });
      }

      const updatedWaypoint = await waypointsCollection.findOne({ _id: new ObjectId(id) });
      console.log(`Waypoint ${id} updated successfully`);

      // Close MongoDB connection
      await client.close();

      return res.json(updatedWaypoint);
    }

    // Handle DELETE request - Delete a waypoint
    else if (req.method === 'DELETE') {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log(`Deleting waypoint ${id} for user ${userId}`);

      // Connect to MongoDB
      const connection = await connectToMongo();
      client = connection.client;
      const db = connection.db;

      const waypointsCollection = db.collection('waypoints');

      // Delete only if waypoint belongs to user
      const result = await waypointsCollection.deleteOne({
        _id: new ObjectId(id),
        userId: userId
      });

      if (result.deletedCount === 0) {
        await client.close();
        return res.status(404).json({ error: 'Waypoint not found or access denied' });
      }

      console.log(`Waypoint ${id} deleted successfully`);

      // Close MongoDB connection
      await client.close();

      return res.json({ success: true, message: 'Waypoint deleted successfully' });
    }

    // Method not allowed
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in waypoint API:', error);

    // Ensure MongoDB connection is closed if there was an error
    if (client) {
      await client.close();
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
