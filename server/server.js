const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://192.168.55.1:3000',
      'https://chatbot-ai-client.onrender.com',
      'https://chatter-ai-kozu.onrender.com',
      'https://chatter-ai-jps9.onrender.com',  // New production frontend URL
      /^http:\/\/192\.168\.\d+\.\d+:3000$/
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// ========================
// SECURITY MIDDLEWARE
// ========================

// Helmet - Sets various HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// Body parser with strict size limits (prevent payload bombs)
app.use(express.json({ limit: '1mb' }));

// Compression
app.use(compression());

// Global rate limiter - 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use(globalLimiter);

// Strict rate limiter for auth routes - 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login/register attempts. Please try again after 15 minutes.' }
});

// Strict rate limiter for bot API - 30 requests per minute per IP
const botLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many bot requests. Please wait a moment before trying again.' }
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://192.168.55.1:3000',
  'https://chatbot-ai-client.onrender.com',
  'https://chatter-ai-kozu.onrender.com',
  'https://chatter-ai-jps9.onrender.com',  // New production frontend URL
  /^http:\/\/192\.168\.\d+\.\d+:3000$/
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or server-to-server requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS rejected origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Make io accessible to routes
app.set('io', io);

// --- ROUTES ---
app.get('/', (req, res) => {
  res.send('ChatterAI API is running...');
});

// Authentication Routes (rate limited - 10 per 15min)
app.use('/api/auth', authLimiter, require('./routes/auth'));

// Room Routes
app.use('/api/rooms', require('./routes/rooms'));

// Message Routes
app.use('/api/messages', require('./routes/messages'));

// Reactions Routes
app.use('/api/messages', require('./routes/reactions'));

// Bot Routes (rate limited - 30 per minute)
app.use('/api/bot', botLimiter, require('./routes/bot'));

// Admin Routes
app.use('/api/admin', require('./routes/admin'));

// Profile Routes
app.use('/api/profile', require('./routes/profile'));

// Bot Learning Routes
app.use('/api/bot-learning', require('./routes/botLearning'));

// --- SOCKET.IO CONNECTION ---
const socketHandler = require('./socket/socketHandler');
socketHandler(io);

// --- DATABASE CONNECTION ---
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Fix: Drop the old unique googleId index if it exists
    const userModel = require('./models/User');
    const collection = userModel.collection;
    
    try {
      // List all indexes
      const indexes = await collection.getIndexes();
      console.log('📋 Current indexes:', Object.keys(indexes));
      
      // Drop googleId_1 if it exists with unique constraint
      if (indexes['googleId_1']) {
        await collection.dropIndex('googleId_1');
        console.log('✅ Dropped old googleId_1 index');
      }
    } catch (err) {
      console.log('ℹ️ Index operation note:', err.message);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  connectDB();
  console.log(`🚀 Server running on port ${PORT}`);
});
