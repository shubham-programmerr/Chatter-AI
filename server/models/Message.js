const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Not required strictly, because the Bot might not be a "User" in the DB
  },
  senderUsername: {
    type: String,
    default: 'Anonymous'
  },
  content: {
    type: String,
    required: true
  },
  isBot: {
    type: Boolean,
    default: false
  },
  fileUrl: {
    type: String,
    default: '' // For Week 3 Cloudinary integration
  },
  ipAddress: {
    type: String,
    index: true
  },
  isFlagged: {
    type: Boolean,
    default: false,
    index: true
  },
  flaggedWords: [String],
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }]
}, { timestamps: true });

// Add indexes for faster queries
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isFlagged: 1, createdAt: -1 });
messageSchema.index({ ipAddress: 1 });

module.exports = mongoose.model('Message', messageSchema);
