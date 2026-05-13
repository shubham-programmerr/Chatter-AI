const socketHandler = (io) => {
  const User = require('../models/User');
  const Message = require('../models/Message');
  const jwt = require('jsonwebtoken');
  const mongoose = require('mongoose');
  const { filterContent } = require('../utils/contentFilter');

  // SECURITY: Authenticate socket connections with JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      console.log('❌ Socket connection rejected: No token');
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.authenticatedUserId = decoded.userId;
      next();
    } catch (err) {
      console.log('❌ Socket connection rejected: Invalid token');
      return next(new Error('Invalid token'));
    }
  });

  // SECURITY: Validate MongoDB ObjectId format
  const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (userId: ${socket.data.authenticatedUserId})`);

    // User joins a room
    socket.on('joinRoom', async (data) => {
      const { roomId, userId } = data;

      // SECURITY: Validate inputs
      if (!roomId || !userId || !isValidObjectId(roomId) || !isValidObjectId(userId)) {
        return socket.emit('error', 'Invalid room or user ID');
      }

      // SECURITY: Ensure the userId matches the authenticated user
      if (userId !== socket.data.authenticatedUserId) {
        return socket.emit('error', 'User ID mismatch');
      }

      const Room = require('../models/Room');
      const roomCheck = await Room.findById(roomId);
      
      if (!roomCheck) {
        return socket.emit('error', 'Room not found');
      }

      const user = await User.findById(userId);

      // SECURITY: IDOR Check for sockets
      if (roomCheck.isPrivate) {
        const isOwner = roomCheck.owner && roomCheck.owner.toString() === userId;
        const isMember = roomCheck.users.some(u => u.toString() === userId);
        const isAdmin = user && user.isAdmin;

        if (!isOwner && !isMember && !isAdmin) {
          console.warn(`🚨 SECURITY: Unauthorized socket join attempt by ${userId} to room ${roomId}`);
          return socket.emit('error', 'Access denied. You must join this private room first.');
        }
      }

      console.log(`📍 Join room event received:`, { roomId, userId, socketId: socket.id });
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Update user to online
      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Add user to room's users array (if not already there)
      const room = await Room.findByIdAndUpdate(
        roomId,
        { $addToSet: { users: userId } },
        { returnDocument: 'after' }
      ).populate('users', 'username avatar isOnline');

      // Notify others in the room with full user data
      socket.to(roomId).emit('userJoined', {
        _id: user._id,
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        isOnline: true,
        message: 'User joined the room'
      });

      // Send updated users list to ALL users in room (including the joining user)
      io.to(roomId).emit('roomUsersUpdated', room?.users || []);

      console.log(`✅ User ${userId} joined room ${roomId}`);
    });

    // User is typing
    socket.on('typing', (data) => {
      const { roomId, userId, username } = data;
      io.to(roomId).emit('userTyping', { userId, username });
    });

    // User stopped typing
    socket.on('stopTyping', (data) => {
      const { roomId, userId } = data;
      io.to(roomId).emit('userStoppedTyping', { userId });
    });

    // Send message
    socket.on('sendMessage', async (data) => {
      try {
        const { roomId, userId, content, isBot } = data;

        // SECURITY: Validate inputs
        if (!roomId || !userId || !content || !isValidObjectId(roomId) || !isValidObjectId(userId)) {
          return socket.emit('error', 'Invalid message data');
        }

        // SECURITY: Verify user identity
        if (userId !== socket.data.authenticatedUserId) {
          return socket.emit('error', 'User ID mismatch');
        }

        // SECURITY: Enforce message length limit (5000 chars max)
        if (typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
          return socket.emit('error', 'Message must be between 1 and 5000 characters');
        }

        // Get client IP from socket handshake
        const clientIP = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() ||
                         socket.conn.remoteAddress ||
                         'unknown';

        // Filter content for profanity
        const filterResult = filterContent(content);
        console.log(`📝 MESSAGE via SOCKET: Content: "${content}" | Filtered: "${filterResult.isFlagged}" | Words: ${filterResult.flaggedWords.join(', ') || 'none'} | IP: ${clientIP}`);

        // Get sender info
        const sender = await User.findById(userId).lean();
        const senderUsername = sender?.username || 'Anonymous';

        // Save message to DB
        const message = await Message.create({
          room: roomId,
          sender: userId,
          senderUsername: senderUsername,
          content: filterResult.isFlagged ? filterResult.cleanContent : content.trim(),
          isBot: isBot || false,
          ipAddress: clientIP,
          isFlagged: filterResult.isFlagged,
          flaggedWords: filterResult.flaggedWords
        });

        // Handle profanity detection
        if (filterResult.isFlagged) {
          console.warn(`🚨 PROFANITY DETECTED: User: ${senderUsername} (${userId}) | IP: ${clientIP} | Words: ${filterResult.flaggedWords.join(', ')}`);
          
          // Track IP violations
          const IPBan = require('../models/IPBan');
          let ipBanRecord = await IPBan.findOne({ ipAddress: clientIP });
          if (!ipBanRecord) {
            ipBanRecord = await IPBan.create({
              ipAddress: clientIP,
              userId: userId,
              username: senderUsername,
              reason: 'profanity',
              violationCount: 1
            });
          } else {
            ipBanRecord.violationCount += 1;
            await ipBanRecord.save();
          }

          // Send bot warning message
          const violationCount = ipBanRecord.violationCount;
          let warningMessage = '';
          if (violationCount === 1) {
            warningMessage = `⚠️ Warning: Profanity detected and censored. Further violations may result in a ban.`;
          } else if (violationCount === 2) {
            warningMessage = `⚠️ Second warning: Please avoid profanity. Continued violations will result in an IP ban.`;
          } else if (violationCount >= 3) {
            warningMessage = `🚫 You have exceeded the profanity limit (${violationCount} violations). Your IP will be banned.`;
          }

          // Create bot warning message
          const botMessage = await Message.create({
            room: roomId,
            sender: null,
            senderUsername: 'System',
            content: warningMessage,
            isBot: true,
            ipAddress: clientIP
          });

          await botMessage.populate('sender', 'username avatar profilePicture');

          // Emit bot warning to room
          io.to(roomId).emit('messageReceived', botMessage);
        }

        await message.populate('sender', 'username avatar profilePicture');

        // Broadcast to room
        io.to(roomId).emit('messageReceived', message);
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // User leaves room
    socket.on('leaveRoom', async (data) => {
      const { roomId, userId } = data;
      socket.leave(roomId);

      // Remove user from room's users array
      const Room = require('../models/Room');
      const room = await Room.findByIdAndUpdate(
        roomId,
        { $pull: { users: userId } },
        { returnDocument: 'after' }
      ).populate('users', 'username avatar isOnline');

      // Update user to offline if not in any other room
      const userSockets = await io.in(roomId).fetchSockets();
      const userInRoom = userSockets.some(s => s.data?.userId === userId);

      if (!userInRoom) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
      }

      io.to(roomId).emit('userLeft', {
        userId,
        message: 'User left the room'
      });

      // Emit updated users list
      io.to(roomId).emit('roomUsersUpdated', room?.users || []);

      console.log(`User ${userId} left room ${roomId}`);
    });

    // Add reaction to message
    socket.on('reactToMessage', async (data) => {
      try {
        const { roomId, messageId, emoji, userId } = data;

        // SECURITY: Verify user identity (Prevent spoofing reactions as other users)
        if (userId !== socket.data.authenticatedUserId) {
          return socket.emit('error', 'User ID mismatch for reaction');
        }

        const message = await Message.findById(messageId);
        if (!message) return;

        let reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

        if (reactionIndex === -1) {
          message.reactions.push({ emoji, users: [userId] });
        } else {
          if (!message.reactions[reactionIndex].users.includes(userId)) {
            message.reactions[reactionIndex].users.push(userId);
          } else {
            message.reactions[reactionIndex].users = message.reactions[reactionIndex].users.filter(
              id => id.toString() !== userId.toString()
            );
            if (message.reactions[reactionIndex].users.length === 0) {
              message.reactions.splice(reactionIndex, 1);
            }
          }
        }

        await message.save();
        await message.populate('reactions.users', 'username avatar');
        await message.populate('sender', 'username avatar profilePicture');

        // Broadcast reaction to all users in room
        io.to(roomId).emit('messageReactionUpdated', message);
      } catch (error) {
        console.error('❌ Reaction error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);
      
      try {
        const userId = socket.data?.userId;
        const roomId = socket.data?.roomId;

        if (userId && roomId) {
          // Mark user as offline
          await User.findByIdAndUpdate(userId, { isOnline: false });
          console.log(`✅ User ${userId} marked offline`);

          // Remove user from room
          const Room = require('../models/Room');
          const room = await Room.findByIdAndUpdate(
            roomId,
            { $pull: { users: userId } },
            { returnDocument: 'after' }
          ).populate('users', 'username avatar isOnline');

          // Notify room of user leaving
          io.to(roomId).emit('userLeft', {
            userId,
            message: 'User disconnected'
          });

          // Emit updated users list
          io.to(roomId).emit('roomUsersUpdated', room?.users || []);

          console.log(`✅ User ${userId} removed from room ${roomId}`);
        }
      } catch (error) {
        console.error('❌ Disconnect error:', error);
      }
    });
  });
};

module.exports = socketHandler;
