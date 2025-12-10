import { Router } from 'express';
import { connectToMongo } from '../config/database.js';

const router = Router();

/**
 * Escape special regex characters in a string to prevent regex injection
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for use in RegExp
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { imei, password } = req.body;

    if (!imei || !password) {
      return res.status(400).json({ error: 'IMEI/Boat name/Username and password are required' });
    }

    console.log(`Login attempt with identifier: ${imei}`);

    // Check for global password from .env
    const globalPassword = process.env.GLOBAL_PASSW;
    const useGlobalPassword = password === globalPassword;

    // Connect to MongoDB
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('users');

    // Try multiple lookup strategies: IMEI, Boat name, or Username
    console.log(`Searching for user with identifier: ${imei}`);
    let user;

    // If using global password, skip password validation
    if (useGlobalPassword) {
      console.log('Global password login - looking up user without password check:', imei);
      user = await usersCollection.findOne({ IMEI: imei });

      // If not found by IMEI, try by Boat name (case-insensitive)
      if (!user) {
        console.log(`No user found with IMEI, trying Boat name: ${imei}`);
        user = await usersCollection.findOne({
          Boat: { $regex: new RegExp(`^${escapeRegex(imei)}$`, 'i') }
        });
      }

      // If still not found, try by username (case-insensitive)
      if (!user) {
        console.log(`No user found with Boat name, trying username: ${imei}`);
        user = await usersCollection.findOne({
          username: { $regex: new RegExp(`^${escapeRegex(imei)}$`, 'i') }
        });
      }
    } else {
      // Normal password validation
      user = await usersCollection.findOne({ IMEI: imei, password });

      // If not found by IMEI, try by Boat name (case-insensitive)
      if (!user) {
        console.log(`No user found with IMEI, trying Boat name: ${imei}`);
        user = await usersCollection.findOne({
          Boat: { $regex: new RegExp(`^${escapeRegex(imei)}$`, 'i') },
          password
        });
      }

      // If still not found, try by username (case-insensitive)
      if (!user) {
        console.log(`No user found with Boat name, trying username: ${imei}`);
        user = await usersCollection.findOne({
          username: { $regex: new RegExp(`^${escapeRegex(imei)}$`, 'i') },
          password
        });
      }
    }

    if (!user) {
      console.log('No user found with these credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Map MongoDB user to app user format
    const appUser = {
      id: user._id.toString(),
      name: user.Boat || user.username || `Vessel ${user.IMEI?.slice(-4) || 'Unknown'}`,
      username: user.username || null,
      imeis: user.IMEI ? [user.IMEI] : [],
      role: useGlobalPassword ? 'admin' : 'user',
      community: user.Community,
      region: user.Region,
      hasImei: user.hasImei !== false && !!user.IMEI
    };

    console.log('User authenticated:', { name: appUser.name, hasImei: appUser.hasImei });
    res.json(appUser);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, phoneNumber, country, vesselType, mainGearType, boatName, password } = req.body;

    // Validate required fields
    if (!username || !phoneNumber || !country || !vesselType || !mainGearType || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate password is a string
    if (typeof password !== 'string') {
      return res.status(400).json({ error: 'Password must be a string' });
    }

    // Validate password length (consistent with change-password endpoint)
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate boat name is required unless vessel type is "Feet"
    if (vesselType !== 'Feet' && !boatName) {
      return res.status(400).json({ error: 'Boat name is required for this vessel type' });
    }

    console.log(`Registration attempt for username: ${username}`);

    // Connect to MongoDB
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('users');

    // Check if username already exists
    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      console.log(`Username already exists: ${username}`);
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Create new user document
    const newUser = {
      username,
      phoneNumber,
      Country: country,
      vessel_type: vesselType,
      main_gear_type: mainGearType,
      Boat: boatName || null,
      password,
      IMEI: null,
      hasImei: false,
      Community: null,
      Region: null,
      captain: null,
      createdAt: new Date(),
      registrationType: 'self-registered'
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    console.log(`User registered successfully: ${username} with ID: ${result.insertedId}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Demo login endpoint
router.post('/demo-login', async (req, res) => {
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
      role: 'demo',
      community: user.Community,
      region: user.Region,
      isDemoMode: true
    };

    console.log('Demo login successful for:', DEMO_IMEI);
    res.json(appUser);
  } catch (error) {
    console.error('Error during demo login:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

export default router;
