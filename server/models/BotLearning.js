const mongoose = require('mongoose');

const botLearningSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  fact: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'user_info', 'room_info', 'custom'],
    default: 'custom'
  },
  learnedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  importance: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('BotLearning', botLearningSchema);
