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
      return res.status(400).json({ error: 'IMEI/Boat name and password are required' });
    }
    
    // Check for global password from .env
    const globalPassword = process.env.GLOBAL_PASSW;
    if (password === globalPassword) {
      console.log('Global password login successful for:', imei);
      return res.status(200).json({
        id: 'global-user',
        name: `Global User (${imei})`,
        role: 'admin',
        imeis: [imei],
      });
    }
    
    // Connect to MongoDB
    let client;
    try {
      const connection = await connectToMongo();
      client = connection.client;
      const db = connection.db;
      const usersCollection = db.collection('users');
      
      // First, try to find user by IMEI
      let user = await usersCollection.findOne({ IMEI: imei, password });
      
      // If not found by IMEI, try by Boat name
      if (!user) {
        user = await usersCollection.findOne({ Boat: imei, password });
      }
      
      // Close MongoDB connection
      await client.close();
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid IMEI/Boat name or password' });
      }
      
      // Map MongoDB user to app user format
      const appUser = {
        id: user._id.toString(),
        name: user.Boat || `Vessel ${user.IMEI.slice(-4)}`,
        imeis: [user.IMEI],
        role: 'user',
        community: user.Community,
        region: user.Region
      };
      
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