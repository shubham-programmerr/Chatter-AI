const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');
const { filterContent } = require('../utils/contentFilter');

// Get messages in a room with pagination
router.get('/room/:roomId', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // SECURITY: IDOR Check - verify user has access to this room
    const Room = require('../models/Room');
    const room = await Room.findById(req.params.roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.isPrivate) {
      const isOwner = room.owner && room.owner.toString() === req.userId;
      const isMember = room.users.some(u => u.toString() === req.userId);
      
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      const isAdmin = user && user.isAdmin;

      if (!isOwner && !isMember && !isAdmin) {
        console.warn(`🚨 SECURITY: Unauthorized message read attempt by ${req.userId} in room ${room._id}`);
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'username avatar profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for read-only queries (faster)

    res.json(messages.reverse()); // Reverse to show oldest first
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { room, content, isBot } = req.body;

    // SECURITY: Prevent unauthorized posting to private rooms
    const Room = require('../models/Room');
    const roomCheck = await Room.findById(room);
    
    if (!roomCheck) return res.status(404).json({ error: 'Room not found' });
    
    if (roomCheck.isPrivate) {
      const isOwner = roomCheck.owner && roomCheck.owner.toString() === req.userId;
      const isMember = roomCheck.users.some(u => u.toString() === req.userId);
      
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      const isAdmin = user && user.isAdmin;

      if (!isOwner && !isMember && !isAdmin) {
        console.warn(`🚨 SECURITY: Unauthorized message send attempt by ${req.userId} to room ${roomCheck._id}`);
        return res.status(403).json({ error: 'Access denied. You must join the room first.' });
      }
    }

    // Filter content for profanity
    const filterResult = filterContent(content);
    console.log(`📝 MESSAGE CREATED: Content: "${content}" | Filtered: "${filterResult.isFlagged}" | Words: ${filterResult.flaggedWords.join(', ') || 'none'}`);
    
    // Get user info for logging
    const User = require('../models/User');
    const sender = await User.findById(req.userId).lean();
    const senderUsername = sender?.username || 'Anonymous';

    const message = await Message.create({
      room,
      sender: req.userId,
      senderUsername,
      content: filterResult.isFlagged ? filterResult.cleanContent : content,
      isBot: isBot || false,
      ipAddress: req.clientIP,
      isFlagged: filterResult.isFlagged,
      flaggedWords: filterResult.flaggedWords
    });

    // Log flagged messages
    if (filterResult.isFlagged) {
      console.warn(`🚨 PROFANITY DETECTED: User: ${senderUsername} (${req.userId}) | IP: ${req.clientIP} | Words: ${filterResult.flaggedWords.join(', ')}`);
      
      // Track user violations for potential IP banning
      const IPBan = require('../models/IPBan');
      let ipBanRecord = await IPBan.findOne({ ipAddress: req.clientIP });
      if (!ipBanRecord) {
        ipBanRecord = await IPBan.create({
          ipAddress: req.clientIP,
          userId: req.userId,
          username: senderUsername,
          reason: 'profanity',
          violationCount: 1
        });
      } else {
        ipBanRecord.violationCount += 1;
        await ipBanRecord.save();
      }

      // Send bot warning message
      const violationCount = ipBanRecord.violationCount;
      let warningMessage = '';
      if (violationCount === 1) {
        warningMessage = `⚠️ Warning: Profanity detected and censored. Further violations may result in a ban.`;
      } else if (violationCount === 2) {
        warningMessage = `⚠️ Second warning: Please avoid profanity. Continued violations will result in an IP ban.`;
      } else if (violationCount >= 3) {
        warningMessage = `🚫 You have exceeded the profanity limit (${violationCount} violations). Your IP will be banned.`;
      }

      // Create bot warning message
      const botMessage = await Message.create({
        room,
        sender: null, // Bot message
        senderUsername: 'System',
        content: warningMessage,
        isBot: true,
        ipAddress: req.clientIP
      });

      // Emit bot warning via socket if available
      const io = require('../socket/socketHandler');
      if (io) {
        io.to(room.toString()).emit('newMessage', botMessage);
      }
    }

    await message.populate('sender', 'username avatar profilePicture');
    await message.populate('reactions.users', 'username avatar');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete a message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
