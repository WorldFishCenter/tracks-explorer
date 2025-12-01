import { MongoClient } from 'mongodb';

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

// Serverless function handler for login
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
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
  
  try {
    const { imei, password } = req.body;
    
    if (!imei || !password) {
      return res.status(400).json({ error: 'IMEI/Boat name/Username and password are required' });
    }
    
    // Check for global password from .env
    const globalPassword = process.env.GLOBAL_PASSW;
    if (password === globalPassword) {
      console.log('Global password login successful for:', imei);
      return res.status(200).json({
        id: 'global-user',
        name: `Global User (${imei})`,
        role: 'admin',
        imeis: [],
      });
    }
    
    // Connect to MongoDB
    let client;
    try {
      const connection = await connectToMongo();
      client = connection.client;
      const db = connection.db;
      const usersCollection = db.collection('users');
      
      // Try multiple lookup strategies: IMEI, Boat name, or Username
      console.log(`Searching for user with identifier: ${imei}`);
      let user = await usersCollection.findOne({ IMEI: imei, password });

      // If not found by IMEI, try by Boat name
      if (!user) {
        console.log(`No user found with IMEI, trying Boat name: ${imei}`);
        user = await usersCollection.findOne({ Boat: imei, password });
      }

      // If still not found, try by username (for self-registered users)
      if (!user) {
        console.log(`No user found with Boat name, trying username: ${imei}`);
        user = await usersCollection.findOne({ username: imei, password });
      }

      // Close MongoDB connection
      await client.close();

      if (!user) {
        console.log('No user found with these credentials');
        return res.status(401).json({ error: 'Invalid IMEI/Boat name/Username or password' });
      }

      // Map MongoDB user to app user format
      const appUser = {
        id: user._id.toString(),
        name: user.Boat || user.username || `Vessel ${user.IMEI?.slice(-4) || 'Unknown'}`,
        username: user.username || null, // Include username for non-PDS users
        imeis: user.IMEI ? [user.IMEI] : [], // Empty array if no IMEI (self-registered users)
        role: 'user',
        community: user.Community,
        region: user.Region,
        hasImei: user.hasImei !== false && !!user.IMEI // Use explicit flag if available, otherwise derive from IMEI
      };

      console.log('User authenticated:', { name: appUser.name, hasImei: appUser.hasImei });
      
      return res.status(200).json(appUser);
    } catch (error) {
      // Ensure MongoDB connection is closed if there was an error
      if (client) {
        await client.close();
      }
      throw error;
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 