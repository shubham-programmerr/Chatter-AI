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
  const [roomPassword, setRoomPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRooms, setTotalRooms] = useState(0);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (page = 1) => {
    setIsLoadingRooms(true);
    try {
      const response = await axios.get(`${API_URL}/rooms?page=${page}&limit=15`);
      const { rooms: roomsData, pagination } = response.data;
      setRooms(roomsData);
      setCurrentPage(pagination.page);
      setTotalPages(pagination.pages);
      setTotalRooms(pagination.total);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
      setError('Failed to load rooms');
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      console.log('✨ Creating room with:', { roomName, roomDescription, isPrivate, hasPassword: !!roomPassword });
      const response = await axios.post(
        `${API_URL}/rooms`,
        {
          name: roomName,
          description: roomDescription,
          isPrivate,
          password: roomPassword || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('✅ Room created:', response.data);
      setRoomName('');
      setRoomDescription('');
      setIsPrivate(false);
      setRoomPassword('');
      // Reload first page to show new room
      setCurrentPage(1);
      await fetchRooms(1);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create room';
      console.error('❌ Create room error:', errorMsg, err);
      setError(errorMsg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId, passwordProtected = false) => {
    try {
      setError('');

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
        `${API_URL}/rooms/${roomId}/join`,
        { password },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      navigate(`/chat/${roomId}`);
    } catch (err) {
      // If error suggests room settings changed, refresh rooms list
      if (err.response?.status === 404 || err.response?.status === 403) {
        await fetchRooms();
        
        // Try again without password if it was a public room
        if (passwordProtected) {
          try {
            const response = await axios.post(
              `${API_URL}/rooms/${roomId}/join`,
              { password: '' },
              {
                headers: { Authorization: `Bearer ${token}` }
              }
            );
            navigate(`/chat/${roomId}`);
            return;
          } catch (retryErr) {
            // Still failed, show error
          }
        }
      }
      
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
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="text-2xl md:text-3xl flex-shrink-0">💬</div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  ChatterAI
                </h1>
                <p className="text-xs text-gray-500 font-medium hidden md:block">Real-time AI Chat Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs md:text-sm text-gray-600">Welcome back</p>
                <p className="text-base md:text-lg font-bold text-gray-800 truncate">{user?.username}</p>
              </div>

              {user?.isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg text-sm md:text-base flex-shrink-0"
                  title="Admin Panel"
                >
                  <span className="inline md:hidden">⚙️</span>
                  <span className="hidden md:inline">⚙️ Admin</span>
                </button>
              )}

              <button
                onClick={() => navigate('/profile')}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-sm md:text-base flex-shrink-0"
                title="Edit profile"
              >
                <span className="inline md:hidden">👤</span>
                <span className="hidden md:inline">👤 Profile</span>
              </button>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg text-sm md:text-base flex-shrink-0"
                title="Logout"
              >
                <span className="inline md:hidden">🚪</span>
                <span className="hidden md:inline">🚪 Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Create Room Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 lg:sticky lg:top-20 border border-gray-200">
              <div className="flex items-center gap-2 mb-6">
                <div className="text-xl md:text-2xl">✨</div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800">Create Room</h2>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-xs md:text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., General Discussion"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 text-base md:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="What's this room for?"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none bg-gray-50 text-base md:text-sm"
                    rows="4"
                  />
                </div>

                <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 p-3 md:p-4 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-purple-600"
                  />
                  <label htmlFor="isPrivate" className="flex items-center gap-2 cursor-pointer text-xs md:text-sm font-semibold text-gray-700">
                    <span>🔒</span>
                    <span>Make this room private</span>
                  </label>
                </div>

                {isPrivate && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 md:p-4 rounded-lg border border-blue-200">
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span>🔐</span>
                      <span>Room Password (Optional)</span>
                    </label>
                    <input
                      type="password"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="Enter a PIN code (e.g., 1234)"
                      className="w-full border border-blue-300 rounded-lg px-4 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-base md:text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Leave empty for no password protection
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 md:py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105 active:scale-95 text-sm md:text-base"
                >
                  {isCreating ? '🔄 Creating...' : '➕ Create Room'}
                </button>
              </form>
            </div>
          </div>

          {/* Rooms List */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                <span>🌐</span> Available Rooms
              </h2>
            </div>

            {rooms.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center border border-gray-200">
                <div className="text-5xl md:text-6xl mb-4">📭</div>
                <p className="text-gray-600 text-base md:text-lg mb-4">No rooms available yet.</p>
                <p className="text-gray-500 text-sm md:text-base">Create the first room to get started! →</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-gray-200 hover:border-blue-300 p-4 md:p-6 group"
                  >
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-blue-600 transition truncate">
                            #{room.name}
                          </h3>
                          {room.isPrivate && (
                            <span className="text-lg" title="Private room">🔒</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs md:text-sm mt-1">
                          👤 <span className="font-semibold">{room.owner?.username || 'Unknown'}</span>
                        </p>
                        {room.description && (
                          <p className="text-gray-600 mt-2 text-xs md:text-sm leading-relaxed line-clamp-2">{room.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 md:gap-3 text-gray-600 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👥</span>
                          <span className="text-xs md:text-sm font-medium">
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
                        onClick={() => handleJoinRoom(room._id, room.passwordProtected)}
                        disabled={
                          room.isPrivate && 
                          !room.users.some(u => u._id === user?._id) && 
                          !room.passwordProtected &&
                          (room.owner?._id !== user?._id && room.owner?.toString?.() !== user?._id)
                        }
                        className={`text-white px-4 md:px-6 py-1.5 md:py-2 rounded-lg transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-xs md:text-sm flex-shrink-0 ${
                          room.isPrivate && 
                          !room.users.some(u => u._id === user?._id) && 
                          !room.passwordProtected &&
                          (room.owner?._id !== user?._id && room.owner?.toString?.() !== user?._id)
                            ? 'bg-gray-400 cursor-not-allowed opacity-50'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                        }`}
                        title={
                          room.isPrivate && 
                          !room.users.some(u => u._id === user?._id) && 
                          !room.passwordProtected &&
                          (room.owner?._id !== user?._id && room.owner?.toString?.() !== user?._id)
                            ? 'Private room - owner only'
                            : room.passwordProtected ? 'Password protected - enter password to join' : ''
                        }
                      >
                        {room.users.some(u => u._id === user?._id) ? 'Enter' : room.passwordProtected ? '🔐 Join' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 md:gap-4">
                  <button
                    onClick={() => fetchRooms(currentPage - 1)}
                    disabled={currentPage === 1 || isLoadingRooms}
                    className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-3 md:px-4 py-2 rounded-lg transition font-medium text-xs md:text-sm"
                  >
                    ← Previous
                  </button>

                  <div className="flex items-center gap-1 md:gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => fetchRooms(page)}
                        disabled={isLoadingRooms}
                        className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg transition font-medium text-xs md:text-sm ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        } disabled:opacity-50`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => fetchRooms(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoadingRooms}
                    className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 px-3 md:px-4 py-2 rounded-lg transition font-medium text-xs md:text-sm"
                  >
                    Next →
                  </button>
                </div>
              )}

              {/* Room Count Info */}
              <div className="mt-4 text-center">
                <p className="text-xs md:text-sm text-gray-600">
                  Showing <span className="font-bold text-blue-600">{rooms.length}</span> of <span className="font-bold text-blue-600">{totalRooms}</span> rooms
                  {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
