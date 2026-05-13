const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
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

// ==========================================
// MODERATION ROUTES
// ==========================================

// Get all flagged messages with pagination
router.get('/moderation/flagged-messages', adminMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const flaggedMessages = await Message.find({ isFlagged: true })
      .select('content senderUsername ipAddress flaggedWords isFlagged createdAt room')
      .populate('sender', 'username email _id')
      .populate('room', 'name _id')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Message.countDocuments({ isFlagged: true });

    console.log(`📊 Admin fetching flagged messages (page ${page}): ${flaggedMessages.length} of ${total}`);

    res.json({
      flaggedMessages,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('❌ Error fetching flagged messages:', error);
    res.status(500).json({ error: 'Failed to fetch flagged messages' });
  }
});

// Get all banned IPs
router.get('/moderation/banned-ips', adminMiddleware, async (req, res) => {
  try {
    const IPBan = require('../models/IPBan');
    
    const bannedIPs = await IPBan.find({ isActive: true })
      .sort({ bannedAt: -1 })
      .lean();

    console.log(`🚫 Admin fetching banned IPs: ${bannedIPs.length} active bans`);

    res.json(bannedIPs);
  } catch (error) {
    console.error('❌ Error fetching banned IPs:', error);
    res.status(500).json({ error: 'Failed to fetch banned IPs' });
  }
});

// Ban an IP address
router.post('/moderation/ban-ip', adminMiddleware, async (req, res) => {
  try {
    const { ipAddress, reason, notes, username, userId } = req.body;

    if (!ipAddress) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const IPBan = require('../models/IPBan');

    // Check if IP is already banned
    const existingBan = await IPBan.findOne({ ipAddress });
    if (existingBan && existingBan.isActive) {
      return res.status(400).json({ error: 'This IP is already banned' });
    }

    const banRecord = await IPBan.create({
      ipAddress,
      userId,
      username,
      reason: reason || 'manual',
      notes,
      isActive: true
    });

    console.log(`🚫 BANNED IP: ${ipAddress} (Reason: ${reason || 'manual'}) by admin`);

    res.status(201).json(banRecord);
  } catch (error) {
    console.error('❌ Error banning IP:', error);
    res.status(500).json({ error: 'Failed to ban IP' });
  }
});

// Unban an IP address
router.post('/moderation/unban-ip', adminMiddleware, async (req, res) => {
  try {
    const { ipAddress } = req.body;

    if (!ipAddress) {
      return res.status(400).json({ error: 'IP address is required' });
    }

    const IPBan = require('../models/IPBan');

    const banRecord = await IPBan.findOneAndUpdate(
      { ipAddress },
      { 
        isActive: false,
        unbannedAt: new Date()
      },
      { returnDocument: 'after' }
    );

    if (!banRecord) {
      return res.status(404).json({ error: 'IP ban record not found' });
    }

    console.log(`✅ UNBANNED IP: ${ipAddress} by admin`);

    res.json(banRecord);
  } catch (error) {
    console.error('❌ Error unbanning IP:', error);
    res.status(500).json({ error: 'Failed to unban IP' });
  }
});

// Get user activity by IP address
router.get('/moderation/ip-activity/:ip', adminMiddleware, async (req, res) => {
  try {
    const { ip } = req.params;

    // Get messages from this IP
    const messages = await Message.find({ ipAddress: ip })
      .populate('sender', 'username email _id')
      .populate('room', 'name _id')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Get IP ban record if exists
    const IPBan = require('../models/IPBan');
    const banRecord = await IPBan.findOne({ ipAddress: ip }).lean();

    // Get unique users from this IP
    const uniqueUsers = [...new Set(messages.map(m => m.sender?._id?.toString()).filter(Boolean))];

    console.log(`📍 Admin viewing IP activity: ${ip} (${messages.length} messages, ${uniqueUsers.length} users)`);

    res.json({
      ipAddress: ip,
      messageCount: messages.length,
      uniqueUsers: uniqueUsers.length,
      flaggedMessageCount: messages.filter(m => m.isFlagged).length,
      messages,
      banRecord
    });
  } catch (error) {
    console.error('❌ Error fetching IP activity:', error);
    res.status(500).json({ error: 'Failed to fetch IP activity' });
  }
});

// Get stats for moderation dashboard
router.get('/moderation/stats', adminMiddleware, async (req, res) => {
  try {
    const IPBan = require('../models/IPBan');

    const totalFlaggedMessages = await Message.countDocuments({ isFlagged: true });
    const totalActiveBans = await IPBan.countDocuments({ isActive: true });
    const flaggedToday = await Message.countDocuments({
      isFlagged: true,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const recentFlaggedMessages = await Message.find({ isFlagged: true })
      .populate('sender', 'username _id')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log(`📊 Moderation stats: ${totalFlaggedMessages} flagged, ${totalActiveBans} banned IPs`);

    res.json({
      totalFlaggedMessages,
      flaggedToday,
      totalActiveBans,
      recentFlaggedMessages
    });
  } catch (error) {
    console.error('❌ Error fetching moderation stats:', error);
    res.status(500).json({ error: 'Failed to fetch moderation stats' });
  }
});

// Check if current IP is banned (accessible to all authenticated users)
router.get('/check-ip-ban', authMiddleware, async (req, res) => {
  try {
    const clientIP = req.clientIP || 
                     req.headers['x-forwarded-for']?.split(',')[0].trim() ||
                     req.socket.remoteAddress ||
                     'unknown';

    const IPBan = require('../models/IPBan');
    const bannedIP = await IPBan.findOne({
      ipAddress: clientIP,
      isActive: true
    });

    if (bannedIP) {
      console.warn(`⚠️ IP BAN CHECK: User ${req.userId} on banned IP ${clientIP}`);
      return res.status(403).json({
        isBanned: true,
        ipAddress: clientIP,
        reason: bannedIP.reason,
        message: 'Your IP has been banned. Please contact support.'
      });
    }

    res.json({
      isBanned: false,
      ipAddress: clientIP
    });
  } catch (error) {
    console.error('Error checking IP ban:', error);
    res.status(500).json({ error: 'Failed to check IP ban status' });
  }
});

module.exports = router;
