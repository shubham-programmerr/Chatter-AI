const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // SECURITY: Validate input fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // SECURITY: Validate username (3-30 chars, alphanumeric + underscores only)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 3-30 characters (letters, numbers, underscores only)' });
    }

    // SECURITY: Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // SECURITY: Enforce password strength (min 6 chars)
    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({ message: 'Password must be between 6 and 128 characters' });
    }

    // 1. Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password with secure cost factor
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 4. Generate JWT Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h' // Token expires in 24 hours
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Authenticate user & get token
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Use lean() for faster queries (don't need Mongoose document methods)
    // 1. Find user by email
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Check if password matches
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please login with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate new token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      avatar: user.avatar,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Google OAuth login
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'No credential provided' });
    }

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Single optimized query: check by googleId OR email
    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    });

    if (!user) {
      // Create new user from Google
      console.log('➕ Creating new Google user:', email);

      // Generate unique username from email
      let username = email.split('@')[0];
      let counter = 1;

      // Check if username is taken in a single efficient query
      while (await User.findOne({ username }).select('username').lean()) {
        username = `${email.split('@')[0]}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email,
        googleId,
        avatar: picture // Store Google profile picture
      });
    } else if (!user.googleId) {
      // Link Google ID to existing user (only if not already linked)
      console.log('🔗 Linking Google ID to existing user:', email);
      user.googleId = googleId;
      await user.save();
    } else {
      console.log('✅ Google user found, logging in:', email);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
};

module.exports = { register, login, googleLogin };
