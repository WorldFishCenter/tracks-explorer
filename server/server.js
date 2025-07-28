import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory for proper relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
// Remove quotes from MongoDB URI if present and ensure we're only using env vars
const MONGODB_URI = process.env.MONGODB_URI 
  ? process.env.MONGODB_URI.replace(/^"|"$/g, '') 
  : '';

// Display a masked version of the connection string for security
if (MONGODB_URI) {
  const maskedURI = MONGODB_URI.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, '$1$2:****@');
  console.log(`Connecting to MongoDB with URI: ${maskedURI.substring(0, 30)}...`);
} else {
  console.error('MongoDB URI is not defined in environment variables');
}

// Create MongoDB client with proper options
const client = new MongoClient(MONGODB_URI, {
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

// Connect to MongoDB
async function connectToMongo() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
      console.log('Connected to MongoDB');
    }
    return client.db('portal-dev'); // Your database name
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    return null; // Return null instead of exiting process to allow for retry
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running', time: new Date().toISOString() });
});

// API Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { imei, password } = req.body;
    
    if (!imei || !password) {
      return res.status(400).json({ error: 'IMEI/Boat name and password are required' });
    }
    
    console.log(`Login attempt with identifier: ${imei}`);
    
    // Check for global password from .env
    const globalPassword = process.env.GLOBAL_PASSW;
    if (password === globalPassword) {
      console.log('Global password login successful for:', imei);
      return res.json({
        id: 'global-user',
        name: `Global User (${imei})`,
        role: 'admin',
        imeis: [imei],
      });
    }
    
    // Connect to MongoDB
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }
    
    const usersCollection = db.collection('users');
    
    // First, try to find user by IMEI
    console.log(`Searching for user with IMEI: ${imei}`);
    let user = await usersCollection.findOne({ IMEI: imei, password });
    
    // If not found by IMEI, try by Boat name
    if (!user) {
      console.log(`No user found with IMEI, trying Boat name: ${imei}`);
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

// Testing endpoint to check MongoDB connection (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/test-db', async (req, res) => {
    try {
      const db = await connectToMongo();
      if (!db) {
        return res.status(500).json({ success: false, error: 'Failed to connect to database' });
      }
      
      // Try to get user count
      const count = await db.collection('users').countDocuments();
      res.json({ 
        success: true, 
        message: 'Database connection successful', 
        userCount: count,
        dbName: db.databaseName
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server available at http://localhost:${PORT}`);
}); 