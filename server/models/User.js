const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: false, // Optional for OAuth users
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    default: null
  },
  avatar: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    default: ''
  },
  dob: {
    type: Date,
    default: null
  },
  profilePicture: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
