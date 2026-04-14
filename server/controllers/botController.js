// Using Groq API
const Groq = require('groq-sdk');
const { googleSearch, formatSearchResults } = require('../utils/googleSearch');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const Message = require('../models/Message');

// Determine if query needs search
const shouldSearch = (query) => {
  const searchKeywords = [
    'what is', 'who is', 'when', 'where', 'how', 'why',
    'latest', 'current', 'news', 'today', 'search',
    'find', 'tell me', 'explain', 'what\'s', 'who\'s',
    'definition', 'meaning', 'information about',
    'facts about', 'statistics', 'research', 'update',
    'recent', 'new', 'trending', 'breaking'
  ];

  const lowerQuery = query.toLowerCase();
  return searchKeywords.some(keyword => lowerQuery.includes(keyword));
};

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

    console.log('🔑 API Key:', process.env.GROQ_API_KEY ? '✓ Loaded' : '✗ Missing');

    let searchResults = [];
    let searchContext = '';

    // Check if query needs Google search
    if (shouldSearch(botPrompt)) {
      console.log('🔍 Query detected as search query, fetching Google results...');
      searchResults = await googleSearch(botPrompt);
      searchContext = formatSearchResults(searchResults);
    }

    // Call Groq API
    console.log('📞 Calling Groq API...');
    const systemPrompt = `You are ChatterAI, a helpful AI assistant in a chat room. Keep responses concise and friendly. 
Answer questions, help with coding, explain concepts, and engage in meaningful conversation.

${searchContext ? `IMPORTANT: Use the search results below to provide current, accurate, and up-to-date information:
${searchContext}

Base your answer primarily on these search results while maintaining a conversational tone.` : 'Provide helpful information based on your knowledge.'}`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: botPrompt
        }
      ]
    });

    console.log('✅ Groq response received');
    let botReply = response.choices[0].message.content;

    // Append search results link reference if available
    if (searchResults.length > 0) {
      botReply += formatSearchResults(searchResults);
    }

    console.log('💬 Bot reply:', botReply);

    // Save bot message to DB
    const botMessage = await Message.create({
      room: roomId,
      sender: null, // Bot has no sender user
      content: botReply,
      isBot: true
    });

    console.log('💾 Message saved to DB');

    await botMessage.populate('sender', 'username avatar profilePicture');

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
