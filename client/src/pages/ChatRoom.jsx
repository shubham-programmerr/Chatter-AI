import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useSocket from '../hooks/useSocket';
import ChatWindow from '../components/Chat/ChatWindow';
import RoomSettings from '../components/Chat/RoomSettings';
import RoomList from '../components/Sidebar/RoomList';
import OnlineUsers from '../components/Sidebar/OnlineUsers';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { joinRoom, sendMessage, startTyping, stopTyping, leaveRoom, reactToMessage, onMessageReceived, onUserTyping, onUserJoined, onUserLeft, onRoomUsersUpdated, onMessageReactionUpdated, isConnected } = useSocket();

  const [room, setRoom] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Listen for message reactions
  useEffect(() => {
    const unsubscribe = onMessageReactionUpdated((updatedMessage) => {
      console.log('😊 Message reaction updated:', updatedMessage);
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    return unsubscribe;
  }, [onMessageReactionUpdated]);

  const handleReact = (messageId, emoji) => {
    if (!roomId || !user?._id) return;
    reactToMessage(roomId, messageId, emoji, user._id);
  };

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

  const handleTogglePrivacy = async () => {
    if (!room || room.owner?._id !== user?._id) return;

    setTogglingPrivacy(true);
    try {
      const response = await axios.put(
        `${API_URL}/rooms/${roomId}`,
        {
          isPrivate: !room.isPrivate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRoom(response.data);
      console.log('✅ Room privacy updated:', response.data.isPrivate ? 'Private' : 'Public');
    } catch (error) {
      console.error('❌ Failed to toggle privacy:', error);
    } finally {
      setTogglingPrivacy(false);
    }
  };

  const handleRoomSettingsUpdate = (updatedRoom) => {
    setRoom(updatedRoom);
    // Refresh rooms list
    const updatedRooms = rooms.map(r => r._id === updatedRoom._id ? updatedRoom : r);
    setRooms(updatedRooms);
  };

  const handleOpenSettings = async () => {
    // Fetch latest room data to get the password
    try {
      const response = await axios.get(`${API_URL}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoom(response.data);
    } catch (error) {
      console.error('Failed to fetch room details:', error);
    }
    setShowSettings(true);
  };

  const handleJoinRoom = async (newRoomId, passwordProtected = false) => {
    try {
      let password = '';
      // If room is password protected, ask for password
      if (passwordProtected) {
        password = prompt('🔐 This room is password protected.\nPlease enter the password:');
        if (password === null) {
          // User clicked cancel
          return;
        }
      }

      const response = await axios.post(
        `${API_URL}/rooms/${newRoomId}/join`,
        { password },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      navigate(`/chat/${newRoomId}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to join room';
      console.error('Failed to join room', err);
      alert(`❌ ${errorMsg}`);
    }
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
    <div className="h-screen flex bg-gray-100 overflow-hidden">
      {/* Sidebar - Fixed overlay on mobile, flex part on desktop */}
      <div className={`w-72 h-screen md:h-full bg-white shadow-xl flex flex-col overflow-hidden border-r border-gray-200 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-20 md:z-auto`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Logo */}
        <div className="p-2 md:p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg md:text-xl">💬</div>
              <div>
                <h2 className="text-base md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ChatterAI</h2>
                <p className="text-xs text-gray-500 hidden md:block">Chat</p>
              </div>
            </div>
            {/* Close button on mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <RoomList rooms={rooms} currentRoomId={roomId} onJoinRoom={handleJoinRoom} />
        </div>

        {/* Online Users - Fixed max height with internal scrolling */}
        <div className="border-t border-gray-200 flex-shrink-0">
          <div className="max-h-64 md:max-h-72 overflow-y-auto">
            <OnlineUsers users={room.users || []} />
          </div>
        </div>
      </div>

      {/* Overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-10"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
        {/* Chat Container - Full height flex layout */}
        <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Header - Compact, not fixed on desktop */}
          <div className="bg-white shadow-sm px-3 md:px-6 py-2 md:py-3 border-b border-gray-200 flex-shrink-0 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 md:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-600 hover:text-gray-800"
            >
              ☰
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <h1 className="text-xl md:text-xl font-bold text-gray-800 truncate">
                  #{room.name}
                </h1>
                {room.isPrivate && (
                  <span className="text-lg" title="Private room">🔒</span>
                )}
              </div>
              <div className="flex md:flex items-center gap-3 mt-1 flex-wrap text-sm md:text-sm">
                <p className="text-gray-500">
                  👤 <span className="font-semibold text-gray-700">{room.owner?.username || 'Unknown'}</span>
                </p>
              </div>
              {room.description && (
                <p className="hidden lg:block text-gray-500 text-xs md:text-sm mt-1 line-clamp-1">{room.description}</p>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {(room.owner?._id === user?._id || room.owner?.toString?.() === user?._id) && (
                <>
                  <button
                    onClick={handleTogglePrivacy}
                    disabled={togglingPrivacy}
                    className="hidden lg:flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-300 hover:border-purple-400 transition disabled:opacity-50 font-medium text-purple-700 text-xs"
                    title="Toggle room privacy"
                  >
                    <span>{room.isPrivate ? '🔒' : '🌐'}</span>
                    <span className="hidden lg:inline text-xs">{room.isPrivate ? 'Pvt' : 'Pub'}</span>
                  </button>
                  <button
                    onClick={handleOpenSettings}
                    className="hidden md:flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 border border-blue-300 hover:border-blue-400 transition font-medium text-blue-700 text-xs"
                    title="Room settings"
                  >
                    <span>⚙️</span>
                    <span className="hidden lg:inline text-xs">Set</span>
                  </button>
                </>
              )}
              <div className="text-right flex items-center gap-1 md:gap-2">
                <p className="text-xs md:text-sm text-gray-600 font-semibold">
                  👥 <span>{room.users?.length || 0}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Chat Window - Scrollable messages and input */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <ChatWindow
              messages={messages}
              typing={typing}
              currentUser={user}
              onSendMessage={handleSendMessage}
              onReact={handleReact}
            />
          </div>
        </div>
      </div>

      {/* Room Settings Modal */}
      {showSettings && (
        <RoomSettings
          room={room}
          token={token}
          onUpdate={handleRoomSettingsUpdate}
          onClose={() => setShowSettings(false)}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default ChatRoom;
