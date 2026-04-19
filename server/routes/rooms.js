const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const authMiddleware = require('../middleware/authMiddleware');
const { hashRoomPassword, verifyRoomPassword } = require('../utils/roomPassword');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });

    // Populate each room individually
    for (let room of rooms) {
      await room.populate('users', 'username avatar isOnline');
      await room.populate('owner', 'username');
    }

    console.log('📋 Rooms fetched:', rooms.length, rooms.map(r => ({ name: r.name, isPrivate: r.isPrivate, ownerId: r.owner?._id, users: r.users.length })));
    res.json(rooms);
  } catch (error) {
    console.error('❌ Fetch rooms error:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get a specific room (with password for owner)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('users', 'username avatar isOnline')
      .populate('owner', 'username');

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const roomData = room.toObject();
    
    // Include password only for room owner
    if (room.owner._id.toString() !== req.userId) {
      delete roomData.password;
    }

    res.json(roomData);
  } catch (error) {
    console.error('❌ Fetch room error:', error);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// Create a new room
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('✨ Creating room:', { userId: req.userId, isPrivate: req.body.isPrivate, hasPassword: !!req.body.password });

    const { name, description, isPrivate, password } = req.body;

    // Hash password if provided and room is private
    let hashedPassword = null;
    let passwordProtected = false;
    
    if (isPrivate && password) {
      hashedPassword = await hashRoomPassword(password);
      passwordProtected = true;
    }

    const room = await Room.create({
      name,
      description,
      isPrivate: isPrivate || false,
      password: hashedPassword,
      passwordProtected,
      owner: req.userId,
      users: [req.userId]  // Always add owner to users
    });

    // Populate after creating (don't return password)
    await room.populate('users', 'username avatar isOnline');
    await room.populate('owner', 'username');

    console.log('✅ Room created:', { roomId: room._id, isPrivate: room.isPrivate, passwordProtected });
    
    // Send response - include password for room owner
    const roomData = room.toObject();
    if (password && room.owner._id.toString() === req.userId) {
      roomData.password = password; // Send plain text password to owner only
    } else {
      delete roomData.password;
    }
    res.status(201).json(roomData);
  } catch (error) {
    console.error('❌ Create room error:', error.message);
    res.status(500).json({ error: 'Failed to create room', details: error.message });
  }
});

// Join a room
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    console.log('📍 Join room attempt:', { roomId: req.params.id, userId: req.userId, hasPassword: !!req.body.password });

    const room = await Room.findById(req.params.id)
      .populate('users', 'username avatar isOnline')
      .populate('owner', 'username');

    if (!room) return res.status(404).json({ error: 'Room not found' });

    console.log('🏠 Room found:', { name: room.name, isPrivate: room.isPrivate, passwordProtected: room.passwordProtected, ownerId: room.owner?._id });

    // Check if user is the owner
    const isOwner = room.owner && room.owner._id.toString() === req.userId;
    console.log('👤 Is owner?', isOwner);

    // If private, check password OR owner
    if (room.isPrivate) {
      if (isOwner) {
        console.log('✅ Owner can always join private room');
      } else if (room.passwordProtected) {
        // Verify password
        const { password } = req.body;
        if (!password) {
          return res.status(403).json({ error: 'This room is password protected. Please provide password.' });
        }

        const isPasswordCorrect = await verifyRoomPassword(password, room.password);
        if (!isPasswordCorrect) {
          console.log('❌ Incorrect password');
          return res.status(403).json({ error: 'Incorrect password. Access denied.' });
        }
        console.log('✅ Password verified');
      } else {
        // Private room without password - owner only
        console.log('🔒 Private room (no password) - owner only');
        return res.status(403).json({ error: 'This is a private room. Only the owner can join.' });
      }
    }

    // Add user to room if not already there
    const userExists = room.users.some(u => u._id.toString() === req.userId);
    if (!userExists) {
      room.users.push(req.userId);
      await room.save();
      console.log('✅ User added to room');
    } else {
      console.log('ℹ️ User already in room');
    }

    // Re-populate after save
    await room.populate('users', 'username avatar isOnline');
    await room.populate('owner', 'username');
    console.log('✅ Room returned');
    
    // Send response - include password for room owner
    const roomData = room.toObject();
    if (room.owner._id.toString() === req.userId && room.password) {
      // Don't send hashed password, owner won't need it for join
      delete roomData.password;
    } else {
      delete roomData.password;
    }
    res.json(roomData);
  } catch (error) {
    console.error('❌ Join room error:', error);
    res.status(500).json({ error: 'Failed to join room', details: error.message });
  }
});

// Update room (change private/public/password)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Only owner can update room
    if (room.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only room owner can update room settings' });
    }

    const { isPrivate, description, name, password, removePassword } = req.body;

    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    if (description !== undefined) room.description = description;
    if (name !== undefined) room.name = name;

    // Handle password changes
    let plainTextPassword = null;
    if (removePassword) {
      room.password = null;
      room.passwordProtected = false;
      console.log('🔓 Password removed from room');
    } else if (isPrivate === false) {
      // If making room public, clear password
      room.password = null;
      room.passwordProtected = false;
      console.log('🔓 Password removed - room is now public');
    } else if (password && isPrivate) {
      // Hash and set new password for private rooms
      const hashedPassword = await hashRoomPassword(password);
      room.password = hashedPassword;
      room.passwordProtected = true;
      plainTextPassword = password; // Store plain text to return to owner
      console.log('🔐 Password set for private room');
    }

    await room.save();

    await room.populate('users', 'username avatar isOnline');
    await room.populate('owner', 'username');

    // Send response - include plain text password for room owner
    const roomData = room.toObject();
    if (plainTextPassword) {
      roomData.password = plainTextPassword; // Send plain text password to owner only
    } else {
      delete roomData.password;
    }
    res.json(roomData);
  } catch (error) {
    console.error('❌ Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

// Delete room
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Only owner can delete room
    if (room.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Only room owner can delete room' });
    }

    // Delete all messages in this room
    const Message = require('../models/Message');
    await Message.deleteMany({ room: req.params.id });

    // Delete the room
    await Room.findByIdAndDelete(req.params.id);

    console.log('🗑️ Room deleted:', { roomId: req.params.id, ownerId: req.userId });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('❌ Delete room error:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// Leave a room
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $pull: { users: req.userId } },
      { returnDocument: 'after' }
    );

    await room.populate('users', 'username avatar isOnline');
    await room.populate('owner', 'username');

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

module.exports = router;
