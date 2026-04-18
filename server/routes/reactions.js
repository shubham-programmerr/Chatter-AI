const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const authMiddleware = require('../middleware/authMiddleware');

// Add reaction to message
router.post('/:messageId/react', authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji || emoji.length > 2) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Find if this emoji reaction already exists
    let reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex === -1) {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [userId]
      });
    } else {
      // Add user to existing reaction
      if (!message.reactions[reactionIndex].users.includes(userId)) {
        message.reactions[reactionIndex].users.push(userId);
      } else {
        // User already reacted with this emoji, remove the reaction
        message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
          id => id.toString() !== userId.toString()
        );
        
        // If no one reacted with this emoji anymore, remove the reaction
        if (message.reactions[reactionIndex].users.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      }
    }

    await message.save();
    
    // Populate reactions with user data for response
    await message.populate('reactions.users', 'username avatar');
    await message.populate('sender', 'username avatar profilePicture');

    res.json(message);
  } catch (err) {
    console.error('❌ Add reaction error:', err);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Get all reactions for a message
router.get('/:messageId/reactions', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId)
      .populate('reactions.users', 'username avatar');

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message.reactions);
  } catch (err) {
    console.error('❌ Get reactions error:', err);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// Remove reaction from message (alternative way - remove specific user's reaction)
router.delete('/:messageId/react/:emoji', authMiddleware, async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Find reaction
    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex !== -1) {
      // Remove user from reaction
      message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
        id => id.toString() !== userId.toString()
      );

      // If no users left, remove the reaction
      if (message.reactions[reactionIndex].users.length === 0) {
        message.reactions.splice(reactionIndex, 1);
      }
    }

    await message.save();
    await message.populate('reactions.users', 'username avatar');
    await message.populate('sender', 'username avatar profilePicture');

    res.json(message);
  } catch (err) {
    console.error('❌ Remove reaction error:', err);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

module.exports = router;
