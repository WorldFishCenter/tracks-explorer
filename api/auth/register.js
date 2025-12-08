import { connectToDatabase } from '../_utils/mongodb.js';

// Serverless function handler for registration
export default async function handler(req, res) {
  // Set CORS headers FIRST (before any method checks)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle preflight OPTIONS request BEFORE method validation
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests (after handling OPTIONS)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { username, phoneNumber, country, vesselType, mainGearType, boatName, password } = req.body;

    // Validate required fields
    if (!username || !phoneNumber || !country || !vesselType || !mainGearType || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate boat name is required unless vessel type is "Feet"
    if (vesselType !== 'Feet' && !boatName) {
      return res.status(400).json({ error: 'Boat name is required for this vessel type' });
    }

    console.log(`Registration attempt for username: ${username}`);

    // Connect to MongoDB
    const { db } = await connectToDatabase();
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
      password, // Store password in plain text (matching existing approach)
      IMEI: null, // No IMEI for self-registered users
      hasImei: false, // Flag to indicate no tracking device
      Community: null, // Set defaults for required fields
      Region: null,
      captain: null,
      createdAt: new Date(),
      registrationType: 'self-registered'
    };

    // Insert user into database
    const result = await usersCollection.insertOne(newUser);

    console.log(`User registered successfully: ${username} with ID: ${result.insertedId}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: result.insertedId.toString()
    });

  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

