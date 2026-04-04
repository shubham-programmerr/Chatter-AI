import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import ChatWindow from '../components/Chat/ChatWindow';
import RoomList from '../components/Sidebar/RoomList';
import OnlineUsers from '../components/Sidebar/OnlineUsers';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { joinRoom, sendMessage, startTyping, stopTyping, leaveRoom, onMessageReceived, onUserTyping, onUserJoined, onUserLeft, onRoomUsersUpdated, isConnected } = useSocket();

  const [room, setRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch room details and messages
  useEffect(() => {
    if (!roomId) return;

    const fetchData = async () => {
      try {
        // Fetch all rooms
        const roomsRes = await axios.get(`${API_URL}/rooms`);
        setRooms(roomsRes.data);

        // Fetch current room
        const currentRoom = roomsRes.data.find((r) => r._id === roomId);
        setRoom(currentRoom);

        // Fetch messages for this room
        const messagesRes = await axios.get(`${API_URL}/messages/room/${roomId}`);
        setMessages(messagesRes.data);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch data', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  // Join room via socket
  useEffect(() => {
    if (isConnected && roomId && user?._id) {
      console.log('🔗 Joining room:', { roomId, userId: user._id, isConnected });
      joinRoom(roomId, user._id);
    }

    return () => {
      if (user?._id) {
        console.log('🔓 Leaving room:', { roomId, userId: user._id });
        leaveRoom(roomId, user._id);
      }
    };
  }, [isConnected, roomId, user?._id, joinRoom, leaveRoom]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = onMessageReceived((message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => [...prev, message]);
    });

    return unsubscribe;
  }, [onMessageReceived]);

  // Listen for typing indicators
  useEffect(() => {
    const unsubscribe = onUserTyping((data) => {
      setTyping((prev) => {
        if (!prev.includes(data.username)) {
          return [...prev, data.username];
        }
        return prev;
      });

      // Auto remove after 3 seconds
      setTimeout(() => {
        setTyping((prev) => prev.filter((u) => u !== data.username));
      }, 3000);
    });

    return unsubscribe;
  }, [onUserTyping]);

  // Listen for user joined
  useEffect(() => {
    const unsubscribe = onUserJoined((data) => {
      console.log('👤 User joined:', data);
    });

    return unsubscribe;
  }, [onUserJoined]);

  // Listen for user left
  useEffect(() => {
    const unsubscribe = onUserLeft((data) => {
      console.log('👤 User left:', data);
    });

    return unsubscribe;
  }, [onUserLeft]);

  // Listen for room users updated
  useEffect(() => {
    const unsubscribe = onRoomUsersUpdated((users) => {
      console.log('👥 Room users updated:', users);
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: users || []
        };
      });
    });

    return unsubscribe;
  }, [onRoomUsersUpdated]);

  const handleSendMessage = (content) => {
    if (!content.trim() || !roomId || !user?._id) return;

    const isBotMessage = content.trim().startsWith('@bot');
    console.log('📨 Message sent:', { content, isBotMessage });

    if (isBotMessage) {
      // Call bot API
      console.log('🤖 Calling bot API...');
      axios.post(
        `${API_URL}/bot/chat`,
        {
          roomId,
          userId: user._id,
          messageContent: content
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      ).then(res => {
        console.log('✅ Bot API response:', res.data);
      }).catch(error => {
        console.error('❌ Bot API error:', error.response?.data || error.message);
      });
    }

    // Send regular message
    sendMessage(roomId, user._id, content, false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading chat room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-600 mb-4 text-lg">Room not found</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-white shadow-xl flex flex-col overflow-hidden border-r border-gray-200">
        {/* Logo */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="text-2xl">💬</div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ChatterAI</h2>
              <p className="text-xs text-gray-500">Real-time Chat</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <RoomList rooms={rooms} currentRoomId={roomId} />
        </div>

        {/* Online Users */}
        <OnlineUsers users={room.users || []} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm px-8 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                #{room.name}
              </h1>
              {room.description && (
                <p className="text-gray-500 text-sm mt-1">{room.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{room.users?.length || 0}</span> members
              </p>
            </div>
          </div>
        </div>

        {/* Chat Window */}
        <ChatWindow
          messages={messages}
          typing={typing}
          currentUser={user}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatRoom;
