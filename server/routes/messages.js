const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

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

    const message = await Message.create({
      room,
      sender: req.userId,
      content,
      isBot: isBot || false
    });

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
