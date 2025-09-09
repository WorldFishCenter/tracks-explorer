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
        imeis: [],
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

// Get all users (boats)
app.get('/api/users', async (_req, res) => {
  try {
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('users');
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray();

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Demo login endpoint
app.post('/api/auth/demo-login', async (req, res) => {
  try {
    // Demo credentials (must be configured via environment variables)
    const DEMO_IMEI = process.env.DEMO_IMEI;
    const DEMO_PASSWORD = process.env.DEMO_PASSWORD;
    
    if (!DEMO_IMEI || !DEMO_PASSWORD) {
      return res.status(500).json({ error: 'Demo credentials not configured on server' });
    }
    
    console.log(`Demo login attempt with: ${DEMO_IMEI}`);
    
    // Connect to MongoDB
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB for demo login');
      return res.status(500).json({ error: 'Database connection error' });
    }
    
    const usersCollection = db.collection('users');
    
    // First, try to find user by IMEI
    let user = await usersCollection.findOne({ IMEI: DEMO_IMEI, password: DEMO_PASSWORD });
    
    // If not found by IMEI, try by Boat name
    if (!user) {
      user = await usersCollection.findOne({ Boat: DEMO_IMEI, password: DEMO_PASSWORD });
    }
    
    if (!user) {
      console.error('Demo user not found in database:', DEMO_IMEI);
      return res.status(401).json({ error: 'Demo user not found' });
    }
    
    // Map MongoDB user to app user format with demo flag
    const appUser = {
      id: user._id.toString(),
      name: user.Boat || `Vessel ${user.IMEI.slice(-4)}`,
      imeis: [user.IMEI],
      role: 'demo', // Special demo role
      community: user.Community,
      region: user.Region,
      isDemoMode: true // Flag to enable demo mode UI anonymization
    };
    
    console.log('Demo login successful for:', DEMO_IMEI);
    res.json(appUser);
  } catch (error) {
    console.error('Error during demo login:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// Catch Events API Routes
app.post('/api/catch-events', async (req, res) => {
  try {
    const { tripId, date, fishGroup, quantity, photos, gps_photo, imei, catch_outcome } = req.body;
    
    // Validate required fields
    if (!tripId || !date || !imei || catch_outcome === undefined) {
      return res.status(400).json({ error: 'Missing required fields: tripId, date, imei, catch_outcome' });
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
      const validFishGroups = ['reef fish', 'sharks/rays', 'small pelagics', 'large pelagics', 'tuna/tuna-like'];
      if (!validFishGroups.includes(fishGroup)) {
        return res.status(400).json({ error: `Invalid fish group. Must be one of: ${validFishGroups.join(', ')}` });
      }
      
      // Validate quantity
      if (typeof quantity !== 'number' || quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive number' });
      }
    }
    
    console.log(`Creating catch event for trip ${tripId} by IMEI ${imei}`);
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
    const user = await usersCollection.findOne({ IMEI: imei });
    
    // Create catch event document
    const catchEvent = {
      tripId,
      date: new Date(date),
      catch_outcome,
      imei,
      boatName: user?.Boat || null,
      community: user?.Community || null,
      reportedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Only include fishGroup and quantity for actual catches (catch_outcome = 1)
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
app.get('/api/catch-events/trip/:tripId', async (req, res) => {
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

// Get catch events by user IMEI
app.get('/api/catch-events/user/:imei', async (req, res) => {
  try {
    const { imei } = req.params;
    
    if (!imei) {
      return res.status(400).json({ error: 'IMEI is required' });
    }
    
    console.log(`Fetching catch events for user IMEI ${imei}`);
    
    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }
    
    const catchEventsCollection = db.collection('catch-events');
    const events = await catchEventsCollection.find({ imei }).sort({ reportedAt: -1 }).toArray();
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching catch events by user:', error);
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
      
      // Try to get user count and catch events count
      const userCount = await db.collection('users').countDocuments();
      const catchEventsCount = await db.collection('catch-events').countDocuments();
      res.json({ 
        success: true, 
        message: 'Database connection successful', 
        userCount,
        catchEventsCount,
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