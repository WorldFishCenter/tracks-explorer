import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.VITE_MONGODB_URI || '';
const client = new MongoClient(MONGODB_URI);

// Connect to MongoDB
async function connectToMongo() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    return client.db('portal-dev'); // Your database name
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { imei, password } = req.body;
    
    if (!imei || !password) {
      return res.status(400).json({ error: 'IMEI/Boat name and password are required' });
    }
    
    console.log(`Login attempt with identifier: ${imei}`);
    
    // Check for admin user (hardcoded for development)
    if (imei === 'admin' && password === 'admin') {
      return res.json({
        id: 'admin',
        name: 'Admin User',
        role: 'admin',
        imeis: [],
      });
    }
    
    const db = await connectToMongo();
    const usersCollection = db.collection('users');
    
    // First, try to find user by IMEI
    let user = await usersCollection.findOne({ IMEI: imei, password });
    
    // If not found by IMEI, try by Boat name
    if (!user) {
      user = await usersCollection.findOne({ Boat: imei, password });
    }
    
    if (!user) {
      console.log('No user found with these credentials');
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
    
    console.log('User authenticated:', { name: appUser.name, imei });
    res.json(appUser);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 