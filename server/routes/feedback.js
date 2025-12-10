import { Router } from 'express';
import { connectToMongo } from '../config/database.js';

const router = Router();

// Valid feedback types
const VALID_TYPES = ['opinion', 'problem', 'suggestion', 'question', 'other'];

/**
 * POST /api/feedback
 * Submit feedback
 */
router.post('/', async (req, res) => {
  try {
    const { type, message, imei, username } = req.body;

    // Validate type is a string
    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        error: 'Type is required and must be a string'
      });
    }

    // Validate message is a string
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    console.log('Feedback submission received:', { type, message: message.substring(0, 50) });

    // Validate type value
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`
      });
    }

    // Validate message length
    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message must be 2000 characters or less'
      });
    }

    // Validate at least one identifier (imei or username)
    const hasImei = imei && typeof imei === 'string' && imei.length > 0;
    const hasUsername = username && typeof username === 'string' && username.length > 0;

    if (!hasImei && !hasUsername) {
      return res.status(400).json({
        error: 'Either imei or username is required'
      });
    }

    // Connect to MongoDB
    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB for feedback');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const feedbackCollection = db.collection('feedback');
    const usersCollection = db.collection('users');

    // Get user information for additional context
    let user = null;
    let userId = null;

    if (hasImei) {
      user = await usersCollection.findOne({ IMEI: imei });
      if (user) {
        userId = user._id.toString();
      }
    }

    // If no user found by IMEI, try finding by username (for non-PDS users)
    if (!user && hasUsername) {
      user = await usersCollection.findOne({ username: username });
      if (user) {
        userId = user._id.toString();
      }
    }

    // Detect if this is an admin user making a test submission
    const isAdminSubmission = req.body.isAdmin === true;

    console.log(`Admin submission detected: ${isAdminSubmission}`);

    // Create feedback document
    const feedback = {
      userId: userId || (isAdminSubmission ? 'admin' : null),
      imei: isAdminSubmission ? 'admin' : (imei || null),
      username: isAdminSubmission ? null : (username || null),
      boatName: isAdminSubmission ? 'admin' : (user?.Boat || user?.username || null),
      community: isAdminSubmission ? 'admin' : (user?.Community || null),
      type,
      message: message.trim(),
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      adminNotes: null,
      ...(isAdminSubmission && { isAdminSubmission: true })
    };

    // Insert the feedback
    const result = await feedbackCollection.insertOne(feedback);

    // Return the created document
    const createdFeedback = await feedbackCollection.findOne({ _id: result.insertedId });

    console.log(`Feedback created with ID: ${result.insertedId}`);

    res.status(201).json(createdFeedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/feedback/user/:userId
 * Get feedback submitted by a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const feedbackCollection = db.collection('feedback');
    const feedback = await feedbackCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
