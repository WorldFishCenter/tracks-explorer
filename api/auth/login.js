import { MongoClient } from 'mongodb';

// MongoDB Connection
const MONGODB_URI = process.env.VITE_MONGODB_URI || '';

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
      return res.status(400).json({ error: 'IMEI and password are required' });
    }
    
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('pds-dev'); // Your database name
    const usersCollection = db.collection('users');
    
    // Find user by IMEI and password
    const user = await usersCollection.findOne({ IMEI: imei, password });
    
    // Close MongoDB connection
    await client.close();
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid IMEI or password' });
    }
    
    // Map MongoDB user to app user format
    const appUser = {
      id: user._id.toString(),
      name: user.Boat || `Vessel ${imei.slice(-4)}`,
      imeis: [user.IMEI],
      role: 'user',
      community: user.Community,
      region: user.Region
    };
    
    return res.status(200).json(appUser);
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 