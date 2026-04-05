const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register a new user
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create the user
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 4. Generate JWT Token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d' // Token expires in 7 days
    });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
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

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // 3. Generate new token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
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

    // 1. Check if user with googleId exists
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists with Google ID - login
      console.log('✅ Google user found, logging in:', email);
    } else {
      // 2. Check if user with email exists (existing user linking Google)
      user = await User.findOne({ email });

      if (user) {
        // Link Google ID to existing user
        console.log('🔗 Linking Google ID to existing user:', email);
        user.googleId = googleId;
        await user.save();
      } else {
        // 3. Create new user from Google
        console.log('➕ Creating new Google user:', email);

        // Generate unique username from email
        let username = email.split('@')[0];
        let usernameTaken = await User.findOne({ username });
        let counter = 1;

        while (usernameTaken) {
          username = `${email.split('@')[0]}${counter}`;
          usernameTaken = await User.findOne({ username });
          counter++;
        }

        user = await User.create({
          username,
          email,
          googleId,
          avatar: picture // Store Google profile picture
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
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
