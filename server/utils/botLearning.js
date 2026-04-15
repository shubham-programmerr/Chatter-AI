const BotLearning = require('../models/BotLearning');

// Detect if user is teaching the bot
const isTeachingBot = (message) => {
  const teachingKeywords = [
    'remember that', 'remember,', 'note that', 'note:', 'keep in mind',
    'important:', 'fyi:', 'fun fact:', 'did you know', 'learn that',
    'i want you to remember', 'this is important', 'never forget',
    'always remember', 'you should know', 'let me teach', 'btw',
    'by the way', 'oh and', 'also remember', 'don\'t forget',
    'i\'m telling you', 'believe me', 'trust me'
  ];

  const lowerMessage = message.toLowerCase();
  return teachingKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Extract fact from message
const extractFact = (message) => {
  // Remove common prefixes
  let fact = message
    .replace(/^(remember that|remember,|note that|note:|keep in mind|important:|fyi:|fun fact:|did you know|learn that|i want you to remember|this is important|never forget|always remember|you should know|let me teach|btw|by the way|oh and|also remember|don't forget|i'm telling you|believe me|trust me)\s*/i, '')
    .trim();

  // Remove extra punctuation at the end
  fact = fact.replace(/\s*[.!?]+$/, '').trim();

  // Limit fact length
  if (fact.length > 300) {
    fact = fact.substring(0, 300) + '...';
  }

  return fact;
};

// Save a learned fact
const saveLearningFact = async (roomId, fact, userId, category = 'custom', importance = 2) => {
  try {
    console.log('📚 Saving learned fact:', { roomId, fact: fact.substring(0, 50), importance });

    const learning = await BotLearning.create({
      room: roomId,
      fact,
      category,
      learnedFrom: userId,
      importance
    });

    console.log('✅ Fact saved to bot learning');
    return learning;
  } catch (error) {
    console.error('❌ Error saving learning fact:', error.message);
    return null;
  }
};

// Get relevant learned facts for context
const getLearnedFacts = async (roomId, limit = 5) => {
  try {
    console.log('📚 Fetching learned facts for room:', roomId);

    const facts = await BotLearning.find({ room: roomId })
      .sort({ importance: -1, usageCount: -1, createdAt: -1 })
      .limit(limit)
      .select('fact category importance')
      .lean();

    console.log(`✅ Retrieved ${facts.length} learned facts`);
    return facts;
  } catch (error) {
    console.error('❌ Error fetching learned facts:', error.message);
    return [];
  }
};

// Format learned facts for system prompt
const formatLearnedFacts = (facts) => {
  if (facts.length === 0) {
    return '';
  }

  let formatted = '\n**LEARNED FACTS ABOUT THIS ROOM:**\n';
  facts.forEach((fact, index) => {
    const importance = '⭐'.repeat(fact.importance);
    formatted += `${index + 1}. ${importance} ${fact.fact}\n`;
  });

  return formatted;
};

// Update fact usage
const updateFactUsage = async (factId) => {
  try {
    await BotLearning.findByIdAndUpdate(
      factId,
      {
        $inc: { usageCount: 1 },
        lastUsed: new Date()
      }
    );
  } catch (error) {
    console.error('❌ Error updating fact usage:', error.message);
  }
};

// Get all learned facts in a room (for admin view)
const getAllLearningFacts = async (roomId) => {
  try {
    const facts = await BotLearning.find({ room: roomId })
      .populate('learnedFrom', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return facts;
  } catch (error) {
    console.error('❌ Error fetching all facts:', error.message);
    return [];
  }
};

// Delete a learned fact
const deleteLearnedFact = async (factId) => {
  try {
    await BotLearning.findByIdAndDelete(factId);
    console.log('✅ Learned fact deleted');
    return true;
  } catch (error) {
    console.error('❌ Error deleting fact:', error.message);
    return false;
  }
};

module.exports = {
  isTeachingBot,
  extractFact,
  saveLearningFact,
  getLearnedFacts,
  formatLearnedFacts,
  updateFactUsage,
  getAllLearningFacts,
  deleteLearnedFact
};
