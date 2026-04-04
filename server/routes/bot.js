const express = require('express');
const router = express.Router();
const { handleBotMessage } = require('../controllers/botController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/bot/chat - Send message to bot
router.post('/chat', authMiddleware, async (req, res) => {
  const io = req.app.get('io');
  await handleBotMessage(req, res, io);
});

module.exports = router;
