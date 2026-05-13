const mongoose = require('mongoose');

const ipBanSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    reason: {
      type: String,
      enum: ['profanity', 'spam', 'harassment', 'abuse', 'manual'],
      default: 'manual'
    },
    violationCount: {
      type: Number,
      default: 1
    },
    bannedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    unbannedAt: Date,
    isActive: {
      type: Boolean,
      default: false,
      index: true
    },
    notes: String
  },
  { timestamps: true }
);

module.exports = mongoose.model('IPBan', ipBanSchema);
