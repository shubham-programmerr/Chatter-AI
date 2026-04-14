import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const { user, logout, token, loading } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !token) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/rooms`);
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      console.log('✨ Creating room with:', { roomName, roomDescription, isPrivate });
      const response = await axios.post(
        `${API_URL}/rooms`,
        {
          name: roomName,
          description: roomDescription,
          isPrivate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Room created:', response.data);
      setRooms([response.data, ...rooms]);
      setRoomName('');
      setRoomDescription('');
      setIsPrivate(false);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create room';
      console.error('❌ Create room error:', errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      setError('');
      const response = await axios.post(
        `${API_URL}/rooms/${roomId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      navigate(`/chat/${roomId}`);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to join room';
      setError(errorMsg);
      console.error('Failed to join room', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">💬</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ChatterAI
              </h1>
              <p className="text-xs text-gray-500 font-medium">Real-time AI Chat Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back</p>
              <p className="text-lg font-bold text-gray-800">{user?.username}</p>
            </div>
            {user?.isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg"
              >
                ⚙️ Admin Panel
              </button>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-5 py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              title="Edit profile"
            >
              👤 Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Room Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-20 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-2xl">✨</div>
                <h2 className="text-2xl font-bold text-gray-800">Create Room</h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., General Discussion"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="What's this room for?"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none bg-gray-50"
                    rows="4"
                  />
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-purple-600"
                  />
                  <label htmlFor="isPrivate" className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                    <span>🔒</span>
                    <span>Make this room private</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105 active:scale-95"
                >
                  {isCreating ? '🔄 Creating...' : '➕ Create Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Rooms List */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span>🌐</span> Available Rooms
              </h2>
            </div>

            {rooms.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-lg mb-4">No rooms available yet.</p>
                <p className="text-gray-500">Create the first room to get started! →</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-200 hover:border-blue-300 p-6 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition">
                            #{room.name}
                          </h3>
                          {room.isPrivate && (
                            <span className="text-lg" title="Private room">🔒</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">
                          👤 Owner: <span className="font-semibold">{room.owner?.username || 'Unknown'}</span>
                        </p>
                        {room.description && (
                          <p className="text-gray-600 mt-2 text-sm leading-relaxed">{room.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👥</span>
                          <span className="text-sm font-medium">
                            {room.users.length} member{room.users.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {room.isPrivate && !room.users.some(u => u._id === user?._id) && (
                          <div className="flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-50 px-2 py-1 rounded">
                            <span>🔐</span>
                            <span>Private</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room._id)}
                        disabled={room.isPrivate && !room.users.some(u => u._id === user?._id) && (room.owner?._id !== user?._id && room.owner?.toString?.() !== user?._id)}
                        className={`text-white px-6 py-2 rounded-lg transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                          room.isPrivate && !room.users.some(u => u._id === user?._id) && (room.owner?._id !== user?._id && room.owner?.toString?.() !== user?._id)
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        }`}
                        title={room.isPrivate && !room.users.some(u => u._id === user?._id) && (room.owner?._id !== user?._id && room.owner?.toString?.() !== user?._id) ? 'You cannot join private rooms' : ''}
                      >
                        {room.users.some(u => u._id === user?._id) ? 'Enter' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
