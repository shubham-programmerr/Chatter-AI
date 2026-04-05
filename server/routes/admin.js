const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

// Get all users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    console.log('📋 Admin fetching all users');
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    console.log('✅ Total users:', users.length);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all rooms
router.get('/rooms', adminMiddleware, async (req, res) => {
  try {
    console.log('📋 Admin fetching all rooms');
    const rooms = await Room.find()
      .populate('owner', 'username email')
      .populate('users', 'username')
      .sort({ createdAt: -1 });
    console.log('✅ Total rooms:', rooms.length);
    res.json(rooms);
  } catch (error) {
    console.error('❌ Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Delete user by ID
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('🗑️ Admin deleting user:', userId);

    // Don't allow deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all messages from this user
    await Message.deleteMany({ sender: userId });

    // Remove user from all rooms
    await Room.updateMany({ users: userId }, { $pull: { users: userId } });

    console.log('✅ User deleted:', user.username);
    res.json({ message: 'User deleted successfully', user });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Delete room by ID
router.delete('/rooms/:id', adminMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    console.log('🗑️ Admin deleting room:', roomId);

    const room = await Room.findByIdAndDelete(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Delete all messages in this room
    await Message.deleteMany({ room: roomId });

    console.log('✅ Room deleted:', room.name);
    res.json({ message: 'Room deleted successfully', room });
  } catch (error) {
    console.error('❌ Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Make user admin
router.put('/users/:id/make-admin', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('👑 Admin promoting user to admin:', userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: true },
      { returnDocument: 'after' }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User promoted to admin:', user.username);
    res.json(user);
  } catch (error) {
    console.error('❌ Error promoting user:', error);
    res.status(500).json({ error: 'Failed to promote user' });
  }
});

// Remove admin from user
router.put('/users/:id/remove-admin', adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('👤 Admin removing user from admin:', userId);

    // Don't allow removing yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot remove yourself as admin' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin: false },
      { returnDocument: 'after' }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Admin removed from user:', user.username);
    res.json(user);
  } catch (error) {
    console.error('❌ Error removing admin:', error);
    res.status(500).json({ error: 'Failed to remove admin' });
  }
});

module.exports = router;
