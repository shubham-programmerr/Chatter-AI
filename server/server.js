const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const allowedOrigins = [
  'https://chatbot-ai-client.onrender.com',  // Your frontend URL
  'localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
}));

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.55.1:3000', /^http:\/\/192\.168\.\d+\.\d+:3000$/],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.55.1:3000', /^http:\/\/192\.168\.\d+\.\d+:3000$/],
  credentials: true
}));

// Make io accessible to routes
app.set('io', io);

// --- ROUTES ---
app.get('/', (req, res) => {
  res.send('ChatterAI API is running...');
});

// Authentication Routes
app.use('/api/auth', require('./routes/auth'));

// Room Routes
app.use('/api/rooms', require('./routes/rooms'));

// Message Routes
app.use('/api/messages', require('./routes/messages'));

// Reactions Routes
app.use('/api/messages', require('./routes/reactions'));

// Bot Routes
app.use('/api/bot', require('./routes/bot'));

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
