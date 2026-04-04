const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('users', 'username avatar isOnline')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Create a new room
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    const room = await Room.create({
      name,
      description,
      users: [req.userId]
    });

    await room.populate('users', 'username avatar isOnline');
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join a room
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (!room.users.includes(req.userId)) {
      room.users.push(req.userId);
      await room.save();
    }

    await room.populate('users', 'username avatar isOnline');
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Leave a room
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $pull: { users: req.userId } },
      { new: true }
    ).populate('users', 'username avatar isOnline');

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

module.exports = router;
