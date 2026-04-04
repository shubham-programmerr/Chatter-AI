// Using Groq API
const Groq = require('groq-sdk');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const Message = require('../models/Message');

const handleBotMessage = async (req, res, io) => {
  try {
    const { roomId, userId, messageContent } = req.body;
    console.log('🤖 Bot request received:', { roomId, userId, messageContent });

    // Extract bot mention (@bot your message)
    const botPrompt = messageContent.replace(/@bot\s*/i, '').trim();
    console.log('📝 Extracted prompt:', botPrompt);

    if (!botPrompt) {
      return res.status(400).json({ error: 'Please provide a message for the bot' });
    }

    console.log('🔑 API Key:', process.env.CLAUDE_API_KEY ? '✓ Loaded' : '✗ Missing');

    // Call Groq API
    console.log('📞 Calling Groq API...');
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant in a chat room. Keep responses concise and friendly. Answer questions, help with coding, explain concepts, and engage in meaningful conversation. You are ChatterAI, an AI assistant bot.'
        },
        {
          role: 'user',
          content: botPrompt
        }
      ]
    });

    console.log('✅ Groq response received');
    const botReply = response.choices[0].message.content;
    console.log('💬 Bot reply:', botReply);

    // Save bot message to DB
    const botMessage = await Message.create({
      room: roomId,
      sender: null, // Bot has no sender user
      content: botReply,
      isBot: true
    });

    console.log('💾 Message saved to DB');

    await botMessage.populate('sender', 'username avatar');

    // Emit to room via Socket.io
    if (io) {
      console.log('📤 Emitting to room:', roomId);
      io.to(roomId).emit('messageReceived', {
        ...botMessage.toObject(),
        username: 'ChatterAI 🤖'
      });
    }

    res.json(botMessage);
  } catch (error) {
    console.error('❌ Bot error:', error);
    res.status(500).json({ error: 'Failed to get bot response' });
  }
};

module.exports = { handleBotMessage };
