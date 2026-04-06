const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Fetching profile for user:', req.userId);
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile fetched:', user.username);
    res.json(user);
  } catch (error) {
    console.error('❌ Failed to fetch profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { username, email, phone, dob, profilePicture } = req.body;
    
    console.log('✏️ Updating profile for user:', req.userId);

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken (but not by same user)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Check if username is already taken (but not by same user)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already in use' });
      }
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (dob) user.dob = new Date(dob);
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();
    console.log('✅ Profile updated:', user.username);

    res.json(user);
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

module.exports = router;
