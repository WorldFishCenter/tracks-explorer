import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import net from 'net';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { fileURLToPath } from 'url';
import { tableFromIPC } from 'apache-arrow';
import { initSync, readParquet } from 'parquet-wasm/esm';
import { Storage } from '@google-cloud/storage';

// Get current file directory for proper relative path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory FIRST
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Now define constants that depend on environment variables
const FALLBACK_DIR = path.join(os.tmpdir(), 'fallback_tracks');
const FALLBACK_CACHE_NAME = 'latest.parquet';
const FALLBACK_BUCKET = process.env.FALLBACK_PARQUET_BUCKET;
const FALLBACK_OBJECT = process.env.FALLBACK_PARQUET_OBJECT;

const app = express();
const PREFERRED_PORT = parseInt(process.env.SERVER_PORT, 10) || 3001;

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

// Initialize parquet-wasm once to avoid repeated WASM loading
let parquetInitialized = false;
const initParquet = () => {
  if (parquetInitialized) return;
  const wasmPath = path.join(__dirname, '..', 'node_modules', 'parquet-wasm', 'esm', 'parquet_wasm_bg.wasm');
  const wasmBytes = fs.readFileSync(wasmPath);
  initSync({ module: wasmBytes });
  parquetInitialized = true;
};

// GCS client (optional, only if GCP_SA_KEY is provided)
let storageClient = null;
const getStorageClient = () => {
  if (storageClient) return storageClient;
  const saKey = process.env.GCP_SA_KEY;
  if (!saKey) return null;
  try {
    const credentials = JSON.parse(saKey);
    storageClient = new Storage({ credentials });
    return storageClient;
  } catch (err) {
    console.error('Failed to parse GCP_SA_KEY for Storage client:', err);
    return null;
  }
};

// Ensure fallback directory exists
const ensureFallbackDir = async () => {
  try {
    await fsp.mkdir(FALLBACK_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create fallback directory:', err);
  }
};

// Resolve parquet path: prefer latest local file; otherwise download from env URL once and cache
const getParquetPath = async () => {
  await ensureFallbackDir();

  const existingFiles = fs.readdirSync(FALLBACK_DIR)
    .filter(name => name.endsWith('.parquet'))
    .map(name => path.join(FALLBACK_DIR, name));

  if (existingFiles.length) {
    const latestFile = existingFiles
      .map(file => ({ file, mtime: fs.statSync(file).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)[0].file;
    return latestFile;
  }

  // Try signed URL if provided
  const fallbackUrl = process.env.FALLBACK_PARQUET_URL;
  if (fallbackUrl) {
    try {
      console.log('Downloading fallback parquet from URL:', fallbackUrl);
      const resp = await fetch(fallbackUrl);
      if (!resp.ok) {
        console.error('Failed to download fallback parquet:', resp.status, resp.statusText);
      } else {
        const buffer = Buffer.from(await resp.arrayBuffer());
        const cachedPath = path.join(FALLBACK_DIR, FALLBACK_CACHE_NAME);
        await fsp.writeFile(cachedPath, buffer);
        console.log('Cached fallback parquet to', cachedPath);
        return cachedPath;
      }
    } catch (err) {
      console.error('Error downloading fallback parquet:', err);
    }
  }

  // Otherwise try GCS download with service account
  const storage = getStorageClient();
  if (storage && FALLBACK_BUCKET && FALLBACK_OBJECT) {
    try {
      const cachedPath = path.join(FALLBACK_DIR, FALLBACK_CACHE_NAME);
      await storage.bucket(FALLBACK_BUCKET).file(FALLBACK_OBJECT).download({ destination: cachedPath });
      console.log(`Downloaded fallback parquet from gs://${FALLBACK_BUCKET}/${FALLBACK_OBJECT} to ${cachedPath}`);
      return cachedPath;
    } catch (err) {
      console.error('Error downloading fallback parquet from GCS:', err);
    }
  }

  console.warn('No fallback parquet available: no local cache, no URL, no GCS bucket/object or credentials.');
  return null;
};

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
      return res.status(400).json({ error: 'IMEI/Boat name/Username and password are required' });
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

    // Try multiple lookup strategies: IMEI, Boat name, or Username
    console.log(`Searching for user with identifier: ${imei}`);
    let user = await usersCollection.findOne({ IMEI: imei, password });

    // If not found by IMEI, try by Boat name
    if (!user) {
      console.log(`No user found with IMEI, trying Boat name: ${imei}`);
      user = await usersCollection.findOne({ Boat: imei, password });
    }

    // If still not found, try by username (NEW)
    if (!user) {
      console.log(`No user found with Boat name, trying username: ${imei}`);
      user = await usersCollection.findOne({ username: imei, password });
    }

    if (!user) {
      console.log('No user found with these credentials');
      return res.status(401).json({ error: 'Invalid credentials' });
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
    res.json(appUser);
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, country, vesselType, mainGearType, boatName, password } = req.body;

    // Validate required fields
    if (!username || !country || !vesselType || !mainGearType || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
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

/**
 * Fallback endpoint to serve trip points from local Parquet snapshots when the upstream API fails.
 * Downloads/caches the latest .parquet snapshot (Trip, Time, Lat, Lng) to a temp dir,
 * filters by date range and IMEIs, and returns TripPoint-like JSON.
 */
app.get('/api/fallback/points', async (req, res) => {
  const { dateFrom, dateTo, imeis } = req.query;

  if (!dateFrom || !dateTo) {
    return res.status(400).json({ error: 'dateFrom and dateTo are required (YYYY-MM-DD)' });
  }

  try {
    const parquetPath = await getParquetPath();
    if (!parquetPath) {
      return res.status(404).json({ error: 'No fallback parquet file available (local or download)' });
    }

    // Read parquet with parquet-wasm and convert to Arrow table
    initParquet();
    const fileBuffer = fs.readFileSync(parquetPath);
    const parquetTable = await readParquet(fileBuffer);
    const ipcStream = parquetTable.intoIPCStream();
    const arrowTable = tableFromIPC(ipcStream);

    const fromTs = new Date(dateFrom).getTime();
    const toTs = new Date(dateTo).getTime();
    const imeiSet = imeis ? new Set(String(imeis).split(',').map(s => s.trim()).filter(Boolean)) : null;

    const tripCol = arrowTable.getChild('Trip');
    const timeCol = arrowTable.getChild('Time');
    const latCol = arrowTable.getChild('Lat');
    const lngCol = arrowTable.getChild('Lng');
    const imeiCol = arrowTable.getChild('IMEI') || arrowTable.getChild('imei');

    if (!tripCol || !timeCol || !latCol || !lngCol) {
      return res.status(500).json({ error: 'Fallback parquet missing required columns (Trip, Time, Lat, Lng)' });
    }

    if (imeiSet && !imeiCol) {
      console.warn('Fallback parquet missing IMEI column; cannot filter by IMEI');
      console.warn('Returning all points for date range - frontend should filter by trip if needed');
      // Continue processing - return all points in date range without IMEI filtering
    }

    const points = [];
    const rowCount = arrowTable.numRows ?? 0;

    for (let i = 0; i < rowCount; i++) {
      const rawTime = timeCol.get(i);
      const ts = rawTime !== null && rawTime !== undefined
        ? new Date(rawTime).getTime()
        : NaN;
      if (Number.isNaN(ts) || ts < fromTs || ts > toTs) continue;

      const timeStr = new Date(ts).toISOString();
      const recordImei = imeiCol ? imeiCol.get(i) : undefined;
      const recordImeiStr = recordImei !== undefined && recordImei !== null ? String(recordImei) : undefined;
      if (imeiSet && (!recordImeiStr || !imeiSet.has(recordImeiStr))) {
        continue;
      }

      points.push({
        time: timeStr,
        timestamp: timeStr,
        boat: '',
        tripId: String(tripCol.get(i) ?? ''),
        latitude: Number(latCol.get(i) ?? 0),
        longitude: Number(lngCol.get(i) ?? 0),
        speed: 0,
        range: 0,
        heading: 0,
        boatName: '',
        community: '',
        tripCreated: '',
        tripUpdated: '',
        imei: recordImeiStr,
        deviceId: recordImeiStr,
        lastSeen: timeStr
      });
    }

    res.json(points);
  } catch (error) {
    console.error('Error serving fallback parquet points:', error);
    res.status(500).json({ error: 'Failed to read fallback parquet file' });
  }
});

// Catch Events API Routes
app.post('/api/catch-events', async (req, res) => {
  try {
    const { tripId, date, fishGroup, quantity, photos, gps_photo, imei, username, catch_outcome } = req.body;

    console.log('Catch event request received:', { tripId, date, imei, username, catch_outcome, fishGroup, quantity });

    // Validate required fields - at least one identifier (imei or username) must be present
    // Note: imei or username can be explicitly null, we just need at least one to be a non-empty string
    const hasImei = imei && typeof imei === 'string' && imei.length > 0;
    const hasUsername = username && typeof username === 'string' && username.length > 0;

    if (!tripId || !date || catch_outcome === undefined || (!hasImei && !hasUsername)) {
      console.error('Validation failed:', { tripId: !!tripId, date: !!date, catch_outcome, hasImei, hasUsername });
      return res.status(400).json({ error: 'Missing required fields: tripId, date, (imei or username), catch_outcome' });
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

    const userIdentifier = imei || username;
    console.log(`Creating catch event for trip ${tripId} by ${imei ? 'IMEI' : 'username'} ${userIdentifier}`);
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
    // Support both IMEI (PDS users) and username (non-PDS users)
    const usersCollection = db.collection('users');
    let user = null;

    if (imei) {
      user = await usersCollection.findOne({ IMEI: imei });
    }

    // If no user found by IMEI, try finding by username (for non-PDS users)
    if (!user && username) {
      user = await usersCollection.findOne({ username: username });
    }
    
    // Detect if this is an admin user making a test submission
    const isAdminSubmission = req.body.isAdmin === true;

    console.log(`Admin submission detected: ${isAdminSubmission}`);

    // Create catch event document
    const catchEvent = {
      tripId,
      date: new Date(date),
      catch_outcome,
      // Store imei and username separately - one will be null depending on user type
      imei: isAdminSubmission ? 'admin' : (imei || null),
      username: isAdminSubmission ? null : (username || null),
      boatName: isAdminSubmission ? 'admin' : (user?.Boat || user?.username || null),
      community: isAdminSubmission ? 'admin' : (user?.Community || null),
      reportedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      // Mark admin submissions for easier identification
      ...(isAdminSubmission && { isAdminSubmission: true }),
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

// Get catch events by user identifier (IMEI or username)
app.get('/api/catch-events/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({ error: 'User identifier (IMEI or username) is required' });
    }

    console.log(`Fetching catch events for user identifier ${identifier}`);

    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    const catchEventsCollection = db.collection('catch-events');
    // Query for either IMEI or username matching the identifier
    const events = await catchEventsCollection.find({
      $or: [
        { imei: identifier },
        { username: identifier }
      ]
    }).sort({ reportedAt: -1 }).toArray();

    res.json(events);
  } catch (error) {
    console.error('Error fetching catch events by user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fisher Stats API - Get catch statistics for a fisher
app.get('/api/fisher-stats/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { dateFrom, dateTo, compareWith = 'community' } = req.query;

    if (!identifier) {
      return res.status(400).json({ error: 'User identifier (IMEI or username) is required' });
    }

    console.log(`Fetching fisher stats for identifier: ${identifier}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, compareWith: ${compareWith}`);

    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Parse dates
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const toDate = dateTo ? new Date(dateTo) : new Date();

    // First, check if this is a PDS user (has data in fishers-stats) or non-PDS user (only catch-events)
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({
      $or: [
        { IMEI: identifier },
        { username: identifier }
      ]
    });

    const isPDSUser = user?.hasImei !== false && user?.IMEI;

    let userStats = [];

    if (isPDSUser) {
      // For PDS users: Use fishers-stats collection (external PDS data)
      const fisherStatsCollection = db.collection('fishers-stats');
      const userStatsQuery = {
        imei: identifier,
        date: { $gte: fromDate, $lte: toDate }
      };
      userStats = await fisherStatsCollection.find(userStatsQuery).toArray();
    } else {
      // For non-PDS users: Build stats from catch-events collection
      const catchEventsCollection = db.collection('catch-events');
      const catchEvents = await catchEventsCollection.find({
        username: identifier,
        date: { $gte: fromDate, $lte: toDate }
      }).toArray();

      // Transform catch-events to match fishers-stats format
      userStats = catchEvents
        .filter(event => event.catch_outcome === 1) // Only actual catches
        .map(event => ({
          imei: null, // Non-PDS user
          username: event.username,
          tripId: event.tripId,
          date: event.date,
          fishGroup: event.fishGroup,
          catch_kg: event.quantity, // Assuming quantity is in kg
          reportedAt: event.reportedAt
        }));
    }

    // Calculate summary
    const totalCatch = userStats.reduce((sum, stat) => sum + (stat.catch_kg || 0), 0);
    const totalTrips = new Set(userStats.map(s => s.tripId)).size;
    const successfulTrips = new Set(
      userStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
    ).size;
    const successRate = totalTrips > 0 ? successfulTrips / totalTrips : 0;
    const avgCatchPerTrip = successfulTrips > 0 ? totalCatch / successfulTrips : 0;

    // Group by fish type
    const catchByType = {};
    userStats.forEach(stat => {
      if (stat.catch_kg > 0 && stat.fishGroup) {
        if (!catchByType[stat.fishGroup]) {
          catchByType[stat.fishGroup] = { totalKg: 0, count: 0 };
        }
        catchByType[stat.fishGroup].totalKg += stat.catch_kg;
        catchByType[stat.fishGroup].count += 1;
      }
    });

    const catchByTypeArray = Object.entries(catchByType).map(([fishGroup, data]) => ({
      fishGroup,
      totalKg: data.totalKg,
      count: data.count
    })).sort((a, b) => b.totalKg - a.totalKg);

    // Get recent trips (group by tripId)
    const tripMap = new Map();
    userStats.forEach(stat => {
      if (!tripMap.has(stat.tripId)) {
        tripMap.set(stat.tripId, {
          tripId: stat.tripId,
          date: stat.date,
          catches: []
        });
      }
      if (stat.catch_kg > 0 || tripMap.get(stat.tripId).catches.length === 0) {
        tripMap.get(stat.tripId).catches.push({
          fishGroup: stat.fishGroup,
          catch_kg: stat.catch_kg
        });
      }
    });

    const recentTrips = Array.from(tripMap.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(trip => ({
        tripId: trip.tripId,
        date: trip.date,
        fishGroup: trip.catches.length > 1 ? 'Mixed' : (trip.catches[0]?.fishGroup || 'No catch'),
        catch_kg: trip.catches.reduce((sum, c) => sum + c.catch_kg, 0)
      }));

    // Build time series data (grouped by date for visualization)
    const dailyCatchMap = new Map();
    userStats.forEach(stat => {
      const dateKey = stat.date.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dailyCatchMap.has(dateKey)) {
        dailyCatchMap.set(dateKey, 0);
      }
      dailyCatchMap.set(dateKey, dailyCatchMap.get(dateKey) + (stat.catch_kg || 0));
    });

    const timeSeries = Array.from(dailyCatchMap.entries())
      .map(([date, catch_kg]) => ({ date, catch_kg: Math.round(catch_kg * 10) / 10 }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Comparison logic
    let comparisonData = { avgCatch: 0, avgSuccessRate: 0 };
    let comparisonLabel = '';

    if (compareWith === 'community') {
      const community = user?.Community;

      if (community && isPDSUser) {
        // For PDS users: Compare with community using fishers-stats
        const communityUsers = await usersCollection.find({ Community: community }).toArray();
        const communityImeis = communityUsers.map(u => u.IMEI);

        const fisherStatsCollection = db.collection('fishers-stats');
        const communityStats = await fisherStatsCollection.find({
          imei: { $in: communityImeis, $ne: identifier }, // Exclude current user
          date: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const communityTotalCatch = communityStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
        const communityTotalTrips = new Set(communityStats.map(s => s.tripId)).size;
        const communitySuccessfulTrips = new Set(
          communityStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
        ).size;

        // Use successfulTrips for avgCatch calculation (only trips with actual catch)
        comparisonData.avgCatch = communitySuccessfulTrips > 0 ? communityTotalCatch / communitySuccessfulTrips : 0;
        comparisonData.avgSuccessRate = communityTotalTrips > 0 ? communitySuccessfulTrips / communityTotalTrips : 0;
        comparisonLabel = `${communityImeis.length - 1} fishers in ${community}`;
      } else if (community && !isPDSUser) {
        // For non-PDS users: Compare with community using catch-events
        const communityUsers = await usersCollection.find({ Community: community }).toArray();
        const communityUsernames = communityUsers
          .filter(u => u.username && u.username !== identifier)
          .map(u => u.username);

        if (communityUsernames.length > 0) {
          const catchEventsCollection = db.collection('catch-events');
          const communityEvents = await catchEventsCollection.find({
            username: { $in: communityUsernames },
            date: { $gte: fromDate, $lte: toDate }
          }).toArray();

          const communityTotalCatch = communityEvents
            .filter(e => e.catch_outcome === 1)
            .reduce((sum, e) => sum + (e.quantity || 0), 0);
          const communityTotalTrips = new Set(communityEvents.map(e => e.tripId)).size;
          const communitySuccessfulTrips = new Set(
            communityEvents.filter(e => e.catch_outcome === 1).map(e => e.tripId)
          ).size;

          comparisonData.avgCatch = communitySuccessfulTrips > 0 ? communityTotalCatch / communitySuccessfulTrips : 0;
          comparisonData.avgSuccessRate = communityTotalTrips > 0 ? communitySuccessfulTrips / communityTotalTrips : 0;
          comparisonLabel = `${communityUsernames.length} fishers in ${community}`;
        }
      }
    } else if (compareWith === 'all') {
      if (isPDSUser) {
        // For PDS users: Get all fishers' stats from fishers-stats
        const fisherStatsCollection = db.collection('fishers-stats');
        const allStats = await fisherStatsCollection.find({
          imei: { $ne: identifier }, // Exclude current user
          date: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const allTotalCatch = allStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
        const allTotalTrips = new Set(allStats.map(s => s.tripId)).size;
        const allSuccessfulTrips = new Set(
          allStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
        ).size;

        // Use successfulTrips for avgCatch calculation (only trips with actual catch)
        comparisonData.avgCatch = allSuccessfulTrips > 0 ? allTotalCatch / allSuccessfulTrips : 0;
        comparisonData.avgSuccessRate = allTotalTrips > 0 ? allSuccessfulTrips / allTotalTrips : 0;
        comparisonLabel = 'all fishers';
      } else {
        // For non-PDS users: Get all catch events
        const catchEventsCollection = db.collection('catch-events');
        const allEvents = await catchEventsCollection.find({
          username: { $ne: identifier, $exists: true }, // Exclude current user, only non-PDS users
          date: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const allTotalCatch = allEvents
          .filter(e => e.catch_outcome === 1)
          .reduce((sum, e) => sum + (e.quantity || 0), 0);
        const allTotalTrips = new Set(allEvents.map(e => e.tripId)).size;
        const allSuccessfulTrips = new Set(
          allEvents.filter(e => e.catch_outcome === 1).map(e => e.tripId)
        ).size;

        comparisonData.avgCatch = allSuccessfulTrips > 0 ? allTotalCatch / allSuccessfulTrips : 0;
        comparisonData.avgSuccessRate = allTotalTrips > 0 ? allSuccessfulTrips / allTotalTrips : 0;
        comparisonLabel = 'all fishers';
      }
    } else if (compareWith === 'previous') {
      // Compare with previous period
      const periodDuration = toDate - fromDate;
      const previousFromDate = new Date(fromDate - periodDuration);
      const previousToDate = new Date(fromDate);

      console.log(`Previous period: ${previousFromDate.toISOString()} to ${previousToDate.toISOString()}`);

      let previousStats = [];

      if (isPDSUser) {
        // For PDS users: Use fishers-stats
        const fisherStatsCollection = db.collection('fishers-stats');
        previousStats = await fisherStatsCollection.find({
          imei: identifier,
          date: { $gte: previousFromDate, $lt: previousToDate }
        }).toArray();
      } else {
        // For non-PDS users: Use catch-events
        const catchEventsCollection = db.collection('catch-events');
        const previousEvents = await catchEventsCollection.find({
          username: identifier,
          date: { $gte: previousFromDate, $lt: previousToDate }
        }).toArray();

        // Transform to match stats format
        previousStats = previousEvents
          .filter(event => event.catch_outcome === 1)
          .map(event => ({
            tripId: event.tripId,
            date: event.date,
            catch_kg: event.quantity
          }));
      }

      console.log(`Found ${previousStats.length} stats entries in previous period`);

      const prevTotalCatch = previousStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
      const prevTotalTrips = new Set(previousStats.map(s => s.tripId)).size;
      const prevSuccessfulTrips = new Set(
        previousStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
      ).size;

      console.log(`Previous period: ${prevTotalTrips} trips, ${prevSuccessfulTrips} successful, ${prevTotalCatch} kg`);

      // Use successfulTrips for avgCatch calculation (only trips with actual catch)
      comparisonData.avgCatch = prevSuccessfulTrips > 0 ? prevTotalCatch / prevSuccessfulTrips : 0;
      comparisonData.avgSuccessRate = prevTotalTrips > 0 ? prevSuccessfulTrips / prevTotalTrips : 0;

      // Format date range for comparison label - ALWAYS show the date range, even if no data
      const formatDate = (date) => {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      };
      comparisonLabel = `${formatDate(previousFromDate)} - ${formatDate(previousToDate)}`;
      comparisonData.dateFrom = previousFromDate.toISOString();
      comparisonData.dateTo = previousToDate.toISOString();
      comparisonData.hasData = prevTotalTrips > 0; // Indicate if there's actual data
    }

    res.json({
      summary: {
        totalCatch: Math.round(totalCatch * 10) / 10,
        totalTrips,
        successfulTrips,
        successRate: Math.round(successRate * 100) / 100,
        avgCatchPerTrip: Math.round(avgCatchPerTrip * 10) / 10
      },
      catchByType: catchByTypeArray,
      recentTrips,
      timeSeries, // Daily catch data for visualization
      comparison: {
        type: compareWith,
        avgCatch: Math.round(comparisonData.avgCatch * 10) / 10,
        avgSuccessRate: Math.round(comparisonData.avgSuccessRate * 100) / 100,
        basedOn: comparisonLabel
      }
    });
  } catch (error) {
    console.error('Error fetching fisher stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fisher Performance API - Get performance metrics for a fisher
app.get('/api/fisher-performance/:imei', async (req, res) => {
  try {
    const { imei } = req.params;
    const { dateFrom, dateTo, compareWith = 'community' } = req.query;

    if (!imei) {
      return res.status(400).json({ error: 'IMEI is required' });
    }

    console.log(`Fetching fisher performance for IMEI: ${imei}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, compareWith: ${compareWith}`);

    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Parse dates
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    const performanceCollection = db.collection('fishers-performance');
    const fisherStatsCollection = db.collection('fishers-stats');

    // Get fisher's performance data
    const userPerformance = await performanceCollection.find({
      imei,
      started: { $gte: fromDate, $lte: toDate }
    }).toArray();

    // Group by trip to get trip types with catch amounts
    const tripTypeMap = new Map();
    const tripsWithMetrics = new Map();

    userPerformance.forEach(perf => {
      const tripId = perf.tripId;

      if (!tripsWithMetrics.has(tripId)) {
        tripsWithMetrics.set(tripId, {
          tripType: perf.trip_type,
          metrics: {}
        });

        if (!tripTypeMap.has(perf.trip_type)) {
          tripTypeMap.set(perf.trip_type, { count: 0, totalCatch: 0, trips: new Set() });
        }
        tripTypeMap.get(perf.trip_type).trips.add(tripId);
      }

      tripsWithMetrics.get(tripId).metrics[perf.metric] = perf.value;
    });

    // Get catch amounts for each trip
    const tripIds = Array.from(tripsWithMetrics.keys());
    const statsForTrips = await fisherStatsCollection.find({
      imei,
      tripId: { $in: tripIds }
    }).toArray();

    const tripCatchMap = new Map();
    statsForTrips.forEach(stat => {
      if (!tripCatchMap.has(stat.tripId)) {
        tripCatchMap.set(stat.tripId, 0);
      }
      tripCatchMap.set(stat.tripId, tripCatchMap.get(stat.tripId) + (stat.catch_kg || 0));
    });

    // Calculate average catch per trip type
    tripsWithMetrics.forEach((data, tripId) => {
      const tripType = data.tripType;
      const catchAmount = tripCatchMap.get(tripId) || 0;
      tripTypeMap.get(tripType).totalCatch += catchAmount;
      tripTypeMap.get(tripType).count = tripTypeMap.get(tripType).trips.size;
    });

    const tripTypes = {};
    tripTypeMap.forEach((data, type) => {
      tripTypes[type] = {
        count: data.count,
        avgCatch: data.count > 0 ? Math.round((data.totalCatch / data.count) * 10) / 10 : 0
      };
    });

    // Calculate average metrics
    const metricSums = {
      cpue_kg_per_hour: [],
      kg_per_liter: [],
      search_ratio: []
    };

    userPerformance.forEach(perf => {
      if (metricSums[perf.metric] !== undefined) {
        metricSums[perf.metric].push(perf.value);
      }
    });

    const calculateAvg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const userMetrics = {
      cpue_kg_per_hour: calculateAvg(metricSums.cpue_kg_per_hour),
      kg_per_liter: calculateAvg(metricSums.kg_per_liter),
      search_ratio: calculateAvg(metricSums.search_ratio)
    };

    // Get best trips (highest CPUE)
    const tripsWithCPUE = [];
    tripsWithMetrics.forEach((data, tripId) => {
      if (data.metrics.cpue_kg_per_hour !== undefined) {
        const trip = userPerformance.find(p => p.tripId === tripId);
        tripsWithCPUE.push({
          tripId,
          date: trip.started,
          tripType: data.tripType,
          cpue_kg_per_hour: data.metrics.cpue_kg_per_hour
        });
      }
    });

    const bestTrips = tripsWithCPUE
      .sort((a, b) => b.cpue_kg_per_hour - a.cpue_kg_per_hour)
      .slice(0, 5);

    // Comparison logic
    let comparisonMetrics = {
      cpue_kg_per_hour: 0,
      kg_per_liter: 0,
      search_ratio: 0
    };
    let comparisonLabel = '';

    if (compareWith === 'community') {
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ IMEI: imei });
      const community = user?.Community;

      if (community) {
        const communityUsers = await usersCollection.find({ Community: community }).toArray();
        const communityImeis = communityUsers.map(u => u.IMEI);

        const communityPerformance = await performanceCollection.find({
          imei: { $in: communityImeis, $ne: imei },
          started: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const communityMetricSums = {
          cpue_kg_per_hour: [],
          kg_per_liter: [],
          search_ratio: []
        };

        communityPerformance.forEach(perf => {
          if (communityMetricSums[perf.metric] !== undefined) {
            communityMetricSums[perf.metric].push(perf.value);
          }
        });

        comparisonMetrics.cpue_kg_per_hour = calculateAvg(communityMetricSums.cpue_kg_per_hour);
        comparisonMetrics.kg_per_liter = calculateAvg(communityMetricSums.kg_per_liter);
        comparisonMetrics.search_ratio = calculateAvg(communityMetricSums.search_ratio);

        // Only set label if there's actual data (not all zeros)
        const hasData = comparisonMetrics.cpue_kg_per_hour > 0 ||
                       comparisonMetrics.kg_per_liter > 0 ||
                       comparisonMetrics.search_ratio > 0;
        comparisonLabel = hasData ? `${communityImeis.length - 1} fishers in ${community}` : '';
      }
    } else if (compareWith === 'all') {
      const allPerformance = await performanceCollection.find({
        imei: { $ne: imei },
        started: { $gte: fromDate, $lte: toDate }
      }).toArray();

      const allMetricSums = {
        cpue_kg_per_hour: [],
        kg_per_liter: [],
        search_ratio: []
      };

      allPerformance.forEach(perf => {
        if (allMetricSums[perf.metric] !== undefined) {
          allMetricSums[perf.metric].push(perf.value);
        }
      });

      comparisonMetrics.cpue_kg_per_hour = calculateAvg(allMetricSums.cpue_kg_per_hour);
      comparisonMetrics.kg_per_liter = calculateAvg(allMetricSums.kg_per_liter);
      comparisonMetrics.search_ratio = calculateAvg(allMetricSums.search_ratio);

      // Only set label if there's actual data (not all zeros)
      const hasData = comparisonMetrics.cpue_kg_per_hour > 0 ||
                     comparisonMetrics.kg_per_liter > 0 ||
                     comparisonMetrics.search_ratio > 0;
      comparisonLabel = hasData ? 'all fishers' : '';
    } else if (compareWith === 'previous') {
      const periodDuration = toDate - fromDate;
      const previousFromDate = new Date(fromDate - periodDuration);
      const previousToDate = new Date(fromDate);

      const previousPerformance = await performanceCollection.find({
        imei,
        started: { $gte: previousFromDate, $lt: previousToDate }
      }).toArray();

      const prevMetricSums = {
        cpue_kg_per_hour: [],
        kg_per_liter: [],
        search_ratio: []
      };

      previousPerformance.forEach(perf => {
        if (prevMetricSums[perf.metric] !== undefined) {
          prevMetricSums[perf.metric].push(perf.value);
        }
      });

      comparisonMetrics.cpue_kg_per_hour = calculateAvg(prevMetricSums.cpue_kg_per_hour);
      comparisonMetrics.kg_per_liter = calculateAvg(prevMetricSums.kg_per_liter);
      comparisonMetrics.search_ratio = calculateAvg(prevMetricSums.search_ratio);

      // Only set label if there's actual data (not all zeros)
      const hasData = comparisonMetrics.cpue_kg_per_hour > 0 ||
                     comparisonMetrics.kg_per_liter > 0 ||
                     comparisonMetrics.search_ratio > 0;

      // Format date range for comparison label - ALWAYS show the date range, even if no data
      const formatDate = (date) => {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      };
      comparisonLabel = `${formatDate(previousFromDate)} - ${formatDate(previousToDate)}`;
      comparisonMetrics.hasData = hasData; // Indicate if there's actual data
    }

    // Calculate percent differences
    const calculatePercentDiff = (your, comparison) => {
      if (comparison === 0) return 0;
      return Math.round(((your - comparison) / comparison) * 100);
    };

    const metrics = {
      cpue_kg_per_hour: {
        yourAvg: Math.round(userMetrics.cpue_kg_per_hour * 10) / 10,
        comparisonAvg: Math.round(comparisonMetrics.cpue_kg_per_hour * 10) / 10,
        percentDiff: calculatePercentDiff(userMetrics.cpue_kg_per_hour, comparisonMetrics.cpue_kg_per_hour)
      },
      kg_per_liter: {
        yourAvg: Math.round(userMetrics.kg_per_liter * 10) / 10,
        comparisonAvg: Math.round(comparisonMetrics.kg_per_liter * 10) / 10,
        percentDiff: calculatePercentDiff(userMetrics.kg_per_liter, comparisonMetrics.kg_per_liter)
      },
      search_ratio: {
        yourAvg: Math.round(userMetrics.search_ratio * 10) / 10,
        comparisonAvg: Math.round(comparisonMetrics.search_ratio * 10) / 10,
        percentDiff: calculatePercentDiff(userMetrics.search_ratio, comparisonMetrics.search_ratio)
      }
    };

    res.json({
      tripTypes,
      metrics,
      bestTrips: bestTrips.map(trip => ({
        tripId: trip.tripId,
        date: trip.date,
        tripType: trip.tripType,
        cpue: Math.round(trip.cpue_kg_per_hour * 10) / 10
      })),
      comparison: {
        type: compareWith,
        basedOn: comparisonLabel
      }
    });
  } catch (error) {
    console.error('Error fetching fisher performance:', error);
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

  // Explore new collections for fisher stats
  app.get('/api/explore-fisher-collections', async (req, res) => {
    try {
      const db = await connectToMongo();
      if (!db) {
        return res.status(500).json({ success: false, error: 'Failed to connect to database' });
      }

      // Get multiple sample documents to understand data variety
      const statsSamples = await db.collection('fishers-stats').find().limit(10).toArray();
      const performanceSamples = await db.collection('fishers-performance').find().limit(10).toArray();

      // Get counts
      const statsCount = await db.collection('fishers-stats').countDocuments();
      const performanceCount = await db.collection('fishers-performance').countDocuments();

      // Get unique metrics from performance collection
      const uniqueMetrics = await db.collection('fishers-performance').distinct('metric');

      // Get unique trip types
      const uniqueTripTypes = await db.collection('fishers-performance').distinct('trip_type');

      // Get all field names from sample docs
      const statsFields = statsSamples[0] ? Object.keys(statsSamples[0]) : [];
      const performanceFields = performanceSamples[0] ? Object.keys(performanceSamples[0]) : [];

      res.json({
        success: true,
        fishersStats: {
          count: statsCount,
          fields: statsFields,
          samples: statsSamples
        },
        fishersPerformance: {
          count: performanceCount,
          fields: performanceFields,
          samples: performanceSamples,
          uniqueMetrics,
          uniqueTripTypes
        }
      });
    } catch (error) {
      console.error('Collection exploration error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
}

async function findAvailablePort(startPort, maxAttempts = 10) {
  const checkPort = (port) => new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', reject)
      .once('listening', () => {
        tester.close(() => resolve(port));
      })
      .listen(port);
  });

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const portToTry = startPort + attempt;
    try {
      await checkPort(portToTry);
      if (attempt > 0) {
        console.warn(`Port ${startPort} in use. Falling back to ${portToTry}. Update SERVER_PORT if you need a specific port.`);
      }
      return portToTry;
    } catch (error) {
      if (error.code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error(`Unable to find an open port after checking ${maxAttempts} ports starting at ${startPort}`);
}

async function startServer() {
  try {
    const port = await findAvailablePort(PREFERRED_PORT);
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Server available at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

startServer();
