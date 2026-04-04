const socketHandler = (io) => {
  const User = require('../models/User');
  const Message = require('../models/Message');

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins a room
    socket.on('joinRoom', async (data) => {
      const { roomId, userId } = data;
      console.log(`📍 Join room event received:`, { roomId, userId, socketId: socket.id });
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      // Update user to online
      const user = await User.findByIdAndUpdate(userId, { isOnline: true }, { returnDocument: 'after' });
      console.log(`✅ User marked online:`, { userId, username: user?.username });

      // Add user to room's users array (if not already there)
      const Room = require('../models/Room');
      const room = await Room.findByIdAndUpdate(
        roomId,
        { $addToSet: { users: userId } },
        { returnDocument: 'after' }
      ).populate('users', 'username avatar isOnline');
      console.log(`✅ Room updated with user, total users:`, room?.users?.length);

      // Notify others in the room with full user data
      io.to(roomId).emit('userJoined', {
        _id: user._id,
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        isOnline: true,
        message: 'User joined the room'
      });

      // Emit updated users list to all in room
      io.to(roomId).emit('roomUsersUpdated', room?.users || []);

      console.log(`✅ User ${userId} joined room ${roomId} - event emitted`);
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

        // Save message to DB
        const message = await Message.create({
          room: roomId,
          sender: userId,
          content,
          isBot: isBot || false
        });

        await message.populate('sender', 'username avatar');

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

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
