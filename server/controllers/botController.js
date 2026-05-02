// Using Groq API
const Groq = require('groq-sdk');
const { googleSearch, formatSearchResults } = require('../utils/googleSearch');
const { getWeather, formatWeather } = require('../utils/weatherAPI');
const { getConversationMemory, formatConversationContext, referencesContext } = require('../utils/botMemory');
const { isTeachingBot, extractFact, saveLearningFact, getLearnedFacts, formatLearnedFacts } = require('../utils/botLearning');

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const Message = require('../models/Message');

// Extract location from weather query
const extractLocation = (query) => {
  const weatherPatterns = [
    /weather\s+(?:in|at|of)\s+([^?]+)/i,
    /([^?]+)\s+weather/i,
    /what'?s?\s+the\s+weather\s+(?:in|at|of)\s+([^?]+)/i,
    /temperature\s+(?:in|at|of)\s+([^?]+)/i,
    /(?:is it|how'?s\s+the\s+weather)\s+(?:in|at|of)\s+([^?]+)/i,
    /rain\s+(?:in|at|of)\s+([^?]+)/i,
    /forecast\s+(?:in|at|of)\s+([^?]+)/i
  ];

  for (let pattern of weatherPatterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
};

// Determine if query is about weather
const isWeatherQuery = (query) => {
  const weatherKeywords = [
    'weather', 'temperature', 'rain', 'snow', 'cold', 'hot',
    'forecast', 'climate', 'wind', 'humidity', 'storm',
    'cloudy', 'sunny', 'hail', 'sleet', 'degrees'
  ];

  const lowerQuery = query.toLowerCase();
  return weatherKeywords.some(keyword => lowerQuery.includes(keyword));
};

// Determine if query needs search (only for factual/informational queries, not casual chat)
const shouldSearch = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Don't search for casual/personal conversations
  const casualPatterns = [
    /^how\s+are\s+you/i,
    /^how\'?s?\s+your\s+day/i,
    /^what\'?s?\s+your\s+name/i,
    /^who\s+are\s+you/i,
    /^hello|hi\s+/i,
    /^thanks|thank\s+you/i,
    /^bye|goodbye/i,
    /^good\s+(morning|afternoon|evening)/i,
    /^ok|okay|sure|sounds\s+good/i,
    /^i\s+agree|correct|right/i
  ];

  // If query matches casual patterns, don't search
  if (casualPatterns.some(pattern => pattern.test(lowerQuery))) {
    return false;
  }

  // Only search for these specific factual/informational patterns
  const searchPatterns = [
    /^what\s+is\s+/i,  // What is X?
    /^who\s+is\s+/i,   // Who is X?
    /^when\s+/i,       // When...?
    /^where\s+/i,      // Where...?
    /^why\s+/i,        // Why...?
    /^how\s+to\s+/i,   // How to...?
    /^how\s+do\s+/i,   // How do...?
    /\snews\s/i,       // ...news...
    /\strending\s/i,   // ...trending...
    /\slatest\s/i,     // ...latest...
    /\scurrent\s/i,    // ...current...
    /latest|breaking|today/i,  // Latest/breaking news patterns
    /search for|find information|tell me about|definition|meaning|facts about|statistics|research/i
  ];

  return searchPatterns.some(pattern => pattern.test(lowerQuery));
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

    // Check if user is teaching the bot
    let isTeaching = false;
    let learnedFact = null;
    if (isTeachingBot(botPrompt)) {
      console.log('📚 User is teaching the bot!');
      isTeaching = true;
      const fact = extractFact(botPrompt);
      learnedFact = await saveLearningFact(roomId, fact, userId, 'custom', 3);
    }

    // Load conversation memory
    console.log('💾 Loading conversation memory...');
    const conversationHistory = await getConversationMemory(roomId, 8);
    const conversationContext = formatConversationContext(conversationHistory);
    const hasContextReference = referencesContext(botPrompt);

    // Load learned facts
    console.log('📚 Loading learned facts...');
    const learnedFacts = await getLearnedFacts(roomId, 5);
    const learnedFactsContext = formatLearnedFacts(learnedFacts);

    let weatherInfo = '';
    let searchResults = [];
    let searchContext = '';

    // Check if it's a weather query
    if (isWeatherQuery(botPrompt)) {
      console.log('🌤️ Detected weather query');
      const location = extractLocation(botPrompt);
      
      if (location) {
        console.log('📍 Extracted location:', location);
        const weather = await getWeather(location);
        if (weather) {
          weatherInfo = formatWeather(weather);
          console.log('✅ Weather data fetched');
        }
      }
    }

    // Check if query needs general search (if not weather or weather search failed)
    if (!weatherInfo && shouldSearch(botPrompt)) {
      console.log('🔍 Query detected as search query, fetching results...');
      searchResults = await googleSearch(botPrompt);
      searchContext = formatSearchResults(searchResults);
    }

    // Call Groq API
    console.log('📞 Calling Groq API with learning context...');
    const systemPrompt = `You are ChatterAI, a helpful AI assistant in a chat room. Keep responses concise and friendly. 
Answer questions, help with coding, explain concepts, and engage in meaningful conversation.

Remember this is a group chat, so be aware of conversation history and context.

${conversationContext}

${learnedFactsContext}

${weatherInfo ? `The user asked about weather. Here is the current weather data:
${weatherInfo}

Incorporate this data naturally into your response.` : ''}

${searchContext && !weatherInfo ? `IMPORTANT: Use the search results below to provide current, accurate information:
${searchContext}

Base your answer primarily on these search results.` : ''}

${hasContextReference ? 'The user is referencing previous messages - use the conversation history above to provide context-aware responses.' : ''}

${isTeaching ? 'The user is teaching you something. Acknowledge what you learned and thank them for the information.' : ''}`;

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

    // Append search results link reference if available (but not for weather)
    if (searchResults.length > 0 && !weatherInfo) {
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
