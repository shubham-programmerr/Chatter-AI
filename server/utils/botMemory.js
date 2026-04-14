const Message = require('../models/Message');

// Fetch recent conversation history for context
const getConversationMemory = async (roomId, limit = 8) => {
  try {
    console.log('💾 Fetching conversation memory for room:', roomId);

    // Get last N messages from the room (excluding this current message)
    const messages = await Message.find({ room: roomId })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Reverse to get chronological order (oldest first)
    messages.reverse();

    console.log(`✅ Loaded ${messages.length} messages from memory`);

    return messages;
  } catch (error) {
    console.error('❌ Error fetching conversation memory:', error.message);
    return [];
  }
};

// Format messages into conversation context
const formatConversationContext = (messages) => {
  if (messages.length === 0) {
    return 'No previous conversation history.';
  }

  let context = '**CONVERSATION HISTORY (Recent Messages):**\n';

  messages.forEach((msg, index) => {
    const sender = msg.isBot ? 'ChatterAI Bot 🤖' : (msg.sender?.username || 'Unknown User');
    const time = new Date(msg.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Truncate long messages for context
    const content = msg.content.length > 150
      ? msg.content.substring(0, 150) + '...'
      : msg.content;

    context += `${index + 1}. [${time}] ${sender}: ${content}\n`;
  });

  return context;
};

// Check if query references previous context
const referencesContext = (query) => {
  const contextKeywords = [
    'you said', 'you mentioned', 'earlier', 'before',
    'previously', 'what did', 'remember', 'last time',
    'remind me', 'again', 'like you said', 'about that',
    'that topic', 'that question', 'this conversation'
  ];

  const lowerQuery = query.toLowerCase();
  return contextKeywords.some(keyword => lowerQuery.includes(keyword));
};

module.exports = {
  getConversationMemory,
  formatConversationContext,
  referencesContext
};
