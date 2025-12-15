import { Router } from 'express';
import { connectToMongo, ObjectId } from '../config/database.js';

const router = Router();

// Get all users (boats)
router.get('/', async (_req, res) => {
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

// Get single user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { phoneNumber, Country, vessel_type, main_gear_type, Boat } = req.body;

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('users');

    // Update user document
    const updateDoc = {
      $set: {
        phoneNumber,
        Country,
        vessel_type,
        main_gear_type,
        Boat,
        updatedAt: new Date()
      }
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change user password
router.post('/:userId/change-password', async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const db = await connectToMongo();
    if (!db) {
      console.error('Failed to connect to MongoDB');
      return res.status(500).json({ error: 'Database connection error' });
    }

    const usersCollection = db.collection('users');

    // Verify current password
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      password: currentPassword
    });

    if (!user) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: newPassword,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
