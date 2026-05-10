import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = (process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000').replace('localhost', window.location.hostname !== 'localhost' ? window.location.hostname : 'localhost');

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomId, userId) => {
    console.log('📤 Emitting joinRoom:', { roomId, userId });
    socketRef.current?.emit('joinRoom', { roomId, userId });
  }, []);

  const sendMessage = useCallback((roomId, userId, content, isBot = false) => {
    socketRef.current?.emit('sendMessage', {
      roomId,
      userId,
      content,
      isBot
    });
  }, []);

  const startTyping = useCallback((roomId, userId, username) => {
    socketRef.current?.emit('typing', { roomId, userId, username });
  }, []);

  const stopTyping = useCallback((roomId, userId) => {
    socketRef.current?.emit('stopTyping', { roomId, userId });
  }, []);

  const leaveRoom = useCallback((roomId, userId) => {
    socketRef.current?.emit('leaveRoom', { roomId, userId });
  }, []);

  const onMessageReceived = useCallback((callback) => {
    socketRef.current?.on('messageReceived', callback);
    return () => socketRef.current?.off('messageReceived', callback);
  }, []);

  const onUserTyping = useCallback((callback) => {
    socketRef.current?.on('userTyping', callback);
    return () => socketRef.current?.off('userTyping', callback);
  }, []);

  const onUserStoppedTyping = useCallback((callback) => {
    socketRef.current?.on('userStoppedTyping', callback);
    return () => socketRef.current?.off('userStoppedTyping', callback);
  }, []);

  const onUserJoined = useCallback((callback) => {
    socketRef.current?.on('userJoined', callback);
    return () => socketRef.current?.off('userJoined', callback);
  }, []);

  const onUserLeft = useCallback((callback) => {
    socketRef.current?.on('userLeft', callback);
    return () => socketRef.current?.off('userLeft', callback);
  }, []);

  const onRoomUsersUpdated = useCallback((callback) => {
    socketRef.current?.on('roomUsersUpdated', callback);
    return () => socketRef.current?.off('roomUsersUpdated', callback);
  }, []);

  const reactToMessage = useCallback((roomId, messageId, emoji, userId) => {
    socketRef.current?.emit('reactToMessage', { roomId, messageId, emoji, userId });
  }, []);

  const onMessageReactionUpdated = useCallback((callback) => {
    socketRef.current?.on('messageReactionUpdated', callback);
    return () => socketRef.current?.off('messageReactionUpdated', callback);
  }, []);

  return {
    socket,
    isConnected,
    joinRoom,
    sendMessage,
    startTyping,
    stopTyping,
    leaveRoom,
    reactToMessage,
    onMessageReceived,
    onUserTyping,
    onUserStoppedTyping,
    onUserJoined,
    onUserLeft,
    onRoomUsersUpdated,
    onMessageReactionUpdated
  };
};

export default useSocket;
