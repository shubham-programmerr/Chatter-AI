import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('localhost', window.location.hostname !== 'localhost' ? window.location.hostname : 'localhost');

const Admin = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch users and rooms
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setUsers(usersRes.data);
      setRooms(roomsRes.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Delete user "${username}" and all their data?`)) return;

    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.filter(u => u._id !== userId));
      console.log('✅ User deleted:', username);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    }
  };

  const handleDeleteRoom = async (roomId, roomName) => {
    if (!window.confirm(`Delete room "${roomName}" and all messages?`)) return;

    try {
      await axios.delete(`${API_URL}/admin/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRooms(rooms.filter(r => r._id !== roomId));
      console.log('✅ Room deleted:', roomName);
    } catch (err) {
      setError('Failed to delete room');
      console.error(err);
    }
  };

  const handleMakeAdmin = async (userId, username) => {
    try {
      const updatedUser = await axios.put(
        `${API_URL}/admin/users/${userId}/make-admin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUsers(users.map(u => (u._id === userId ? updatedUser.data : u)));
      console.log('✅ User promoted to admin:', username);
    } catch (err) {
      setError('Failed to promote user');
      console.error(err);
    }
  };

  const handleRemoveAdmin = async (userId, username) => {
    if (userId === user._id) {
      setError('Cannot remove yourself as admin');
      return;
    }

    try {
      const updatedUser = await axios.put(
        `${API_URL}/admin/users/${userId}/remove-admin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setUsers(users.map(u => (u._id === userId ? updatedUser.data : u)));
      console.log('✅ Admin removed:', username);
    } catch (err) {
      setError('Failed to remove admin');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading admin panel...</p>
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
            <div className="text-3xl">⚙️</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-500 font-medium">Platform Management</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Admin: {user?.username}</p>
            </div>
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
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
            }`}
          >
            👥 Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'rooms'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
            }`}
          >
            🌐 Rooms ({rooms.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">{u.username}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.isOnline
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {u.isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.isAdmin
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.isAdmin ? '👑 Admin' : 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {!u.isAdmin ? (
                          <button
                            onClick={() => handleMakeAdmin(u._id, u.username)}
                            className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs font-semibold transition"
                          >
                            Make Admin
                          </button>
                        ) : u._id !== user._id ? (
                          <button
                            onClick={() => handleRemoveAdmin(u._id, u.username)}
                            className="px-3 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded text-xs font-semibold transition"
                          >
                            Remove Admin
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">You</span>
                        )}
                        {u._id !== user._id && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-semibold transition"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Room Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Owner</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Members</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rooms.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-medium text-gray-800">#{r.name}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{r.owner?.username || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {r.users.length} users
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            r.isPrivate
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {r.isPrivate ? '🔒 Private' : '🌐 Public'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteRoom(r._id, r.name)}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
