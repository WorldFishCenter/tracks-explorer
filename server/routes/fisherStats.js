import { Router } from 'express';
import { connectToMongo, ObjectId } from '../config/database.js';

const router = Router();

// Get catch statistics for a fisher
router.get('/:identifier', async (req, res) => {
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
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
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
        .filter(event => event.catch_outcome === 1)
        .map(event => ({
          imei: null,
          username: event.username,
          tripId: event.tripId,
          date: event.date,
          fishGroup: event.fishGroup,
          catch_kg: event.quantity,
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
      const dateKey = stat.date.toISOString().split('T')[0];
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
        const communityUsers = await usersCollection.find({ Community: community }).toArray();
        const communityImeis = communityUsers.map(u => u.IMEI);

        const fisherStatsCollection = db.collection('fishers-stats');
        const communityStats = await fisherStatsCollection.find({
          imei: { $in: communityImeis, $ne: identifier },
          date: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const communityTotalCatch = communityStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
        const communityTotalTrips = new Set(communityStats.map(s => s.tripId)).size;
        const communitySuccessfulTrips = new Set(
          communityStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
        ).size;

        comparisonData.avgCatch = communitySuccessfulTrips > 0 ? communityTotalCatch / communitySuccessfulTrips : 0;
        comparisonData.avgSuccessRate = communityTotalTrips > 0 ? communitySuccessfulTrips / communityTotalTrips : 0;
        comparisonLabel = `${communityImeis.length - 1} fishers in ${community}`;
      } else if (community && !isPDSUser) {
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
        const fisherStatsCollection = db.collection('fishers-stats');
        const allStats = await fisherStatsCollection.find({
          imei: { $ne: identifier },
          date: { $gte: fromDate, $lte: toDate }
        }).toArray();

        const allTotalCatch = allStats.reduce((sum, s) => sum + (s.catch_kg || 0), 0);
        const allTotalTrips = new Set(allStats.map(s => s.tripId)).size;
        const allSuccessfulTrips = new Set(
          allStats.filter(s => s.catch_kg > 0).map(s => s.tripId)
        ).size;

        comparisonData.avgCatch = allSuccessfulTrips > 0 ? allTotalCatch / allSuccessfulTrips : 0;
        comparisonData.avgSuccessRate = allTotalTrips > 0 ? allSuccessfulTrips / allTotalTrips : 0;
        comparisonLabel = 'all fishers';
      } else {
        const catchEventsCollection = db.collection('catch-events');
        const allEvents = await catchEventsCollection.find({
          username: { $ne: identifier, $exists: true },
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
      const periodDuration = toDate - fromDate;
      const previousFromDate = new Date(fromDate - periodDuration);
      const previousToDate = new Date(fromDate);

      console.log(`Previous period: ${previousFromDate.toISOString()} to ${previousToDate.toISOString()}`);

      let previousStats = [];

      if (isPDSUser) {
        const fisherStatsCollection = db.collection('fishers-stats');
        previousStats = await fisherStatsCollection.find({
          imei: identifier,
          date: { $gte: previousFromDate, $lt: previousToDate }
        }).toArray();
      } else {
        const catchEventsCollection = db.collection('catch-events');
        const previousEvents = await catchEventsCollection.find({
          username: identifier,
          date: { $gte: previousFromDate, $lt: previousToDate }
        }).toArray();

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

      comparisonData.avgCatch = prevSuccessfulTrips > 0 ? prevTotalCatch / prevSuccessfulTrips : 0;
      comparisonData.avgSuccessRate = prevTotalTrips > 0 ? prevSuccessfulTrips / prevTotalTrips : 0;

      const formatDate = (date) => {
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
      };
      comparisonLabel = `${formatDate(previousFromDate)} - ${formatDate(previousToDate)}`;
      comparisonData.dateFrom = previousFromDate.toISOString();
      comparisonData.dateTo = previousToDate.toISOString();
      comparisonData.hasData = prevTotalTrips > 0;
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
      timeSeries,
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

export default router;
