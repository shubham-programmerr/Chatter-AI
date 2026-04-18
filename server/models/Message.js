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

module.exports = mongoose.model('Message', messageSchema);
