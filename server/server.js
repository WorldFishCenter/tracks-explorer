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
    
    // Detect if this is an admin user making a test submission
    const isAdminSubmission = req.body.isAdmin === true;

    console.log(`Admin submission detected: ${isAdminSubmission}`);
    
    // Create catch event document
    const catchEvent = {
      tripId,
      date: new Date(date),
      catch_outcome,
      // Replace admin user data with generic admin identifiers
      imei: isAdminSubmission ? 'admin' : imei,
      boatName: isAdminSubmission ? 'admin' : (user?.Boat || null),
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

// Fisher Stats API - Get catch statistics for a fisher
app.get('/api/fisher-stats/:imei', async (req, res) => {
  try {
    const { imei } = req.params;
    const { dateFrom, dateTo, compareWith = 'community' } = req.query;

    if (!imei) {
      return res.status(400).json({ error: 'IMEI is required' });
    }

    console.log(`Fetching fisher stats for IMEI: ${imei}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, compareWith: ${compareWith}`);

    const db = await connectToMongo();
    if (!db) {
      return res.status(500).json({ error: 'Database connection error' });
    }

    // Parse dates
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago
    const toDate = dateTo ? new Date(dateTo) : new Date();

    // Get fisher's stats
    const fisherStatsCollection = db.collection('fishers-stats');
    const userStatsQuery = { imei, date: { $gte: fromDate, $lte: toDate } };
    const userStats = await fisherStatsCollection.find(userStatsQuery).toArray();

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

    // Comparison logic
    let comparisonData = { avgCatch: 0, avgSuccessRate: 0 };
    let comparisonLabel = '';

    if (compareWith === 'community') {
      // Get user's community
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ IMEI: imei });
      const community = user?.Community;

      if (community) {
        // Get all users in same community
        const communityUsers = await usersCollection.find({ Community: community }).toArray();
        const communityImeis = communityUsers.map(u => u.IMEI);

        // Get stats for community
        const communityStats = await fisherStatsCollection.find({
          imei: { $in: communityImeis, $ne: imei }, // Exclude current user
          date: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const communityTotalCatch = communityStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
        const communityTotalTrips = new Set(communityStats.map(s => s.tripId)).size;
        const communitySuccessfulTrips = new Set(
          communityStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
        ).size;

        comparisonData.avgCatch = communityTotalTrips > 0 ? communityTotalCatch / communityTotalTrips : 0;
        comparisonData.avgSuccessRate = communityTotalTrips > 0 ? communitySuccessfulTrips / communityTotalTrips : 0;
        comparisonLabel = `${communityImeis.length - 1} fishers in ${community}`;
      }
    } else if (compareWith === 'all') {
      // Get all fishers' stats
      const allStats = await fisherStatsCollection.find({
        imei: { $ne: imei }, // Exclude current user
        date: { $gte: fromDate, $lte: toDate }
      }).toArray();

      const allTotalCatch = allStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
      const allTotalTrips = new Set(allStats.map(s => s.tripId)).size;
      const allSuccessfulTrips = new Set(
        allStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
      ).size;

      comparisonData.avgCatch = allTotalTrips > 0 ? allTotalCatch / allTotalTrips : 0;
      comparisonData.avgSuccessRate = allTotalTrips > 0 ? allSuccessfulTrips / allTotalTrips : 0;
      comparisonLabel = 'all fishers';
    } else if (compareWith === 'previous') {
      // Compare with previous period
      const periodDuration = toDate - fromDate;
      const previousFromDate = new Date(fromDate - periodDuration);
      const previousToDate = new Date(fromDate);

      const previousStats = await fisherStatsCollection.find({
        imei,
        date: { $gte: previousFromDate, $lt: previousToDate }
      }).toArray();

      const prevTotalCatch = previousStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
      const prevTotalTrips = new Set(previousStats.map(s => s.tripId)).size;
      const prevSuccessfulTrips = new Set(
        previousStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
      ).size;

      comparisonData.avgCatch = prevTotalTrips > 0 ? prevTotalCatch / prevTotalTrips : 0;
      comparisonData.avgSuccessRate = prevTotalTrips > 0 ? prevSuccessfulTrips / prevTotalTrips : 0;
      comparisonLabel = 'previous period';
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
        comparisonLabel = `${communityImeis.length - 1} fishers in ${community}`;
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
      comparisonLabel = 'all fishers';
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
      comparisonLabel = 'previous period';
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server available at http://localhost:${PORT}`);
}); 