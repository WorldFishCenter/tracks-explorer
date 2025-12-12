import { Router } from 'express';
import { connectToMongo } from '../config/database.js';

const router = Router();

// Testing endpoint to check MongoDB connection
router.get('/test-db', async (req, res) => {
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
router.get('/explore-fisher-collections', async (req, res) => {
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

export default router;
