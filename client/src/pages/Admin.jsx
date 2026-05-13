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
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [bannedIPs, setBannedIPs] = useState([]);
  const [moderationStats, setModerationStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [moderationPage, setModerationPage] = useState(1);

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
      const [usersRes, roomsRes, statsRes, bannedRes, flaggedRes] = await Promise.all([
        axios.get(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/admin/moderation/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: {} })),
        axios.get(`${API_URL}/admin/moderation/banned-ips`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/admin/moderation/flagged-messages?page=1&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setUsers(usersRes.data);
      setRooms(roomsRes.data);
      setModerationStats(statsRes.data);
      setBannedIPs(bannedRes.data);
      setFlaggedMessages(flaggedRes.data.flaggedMessages || []);
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

  const handleBanIP = async (ipAddress, reason = 'Profanity violation') => {
    if (!ipAddress) {
      setError('Invalid IP address');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/moderation/ban-ip`,
        { ipAddress, reason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setBannedIPs([...bannedIPs, { ipAddress, reason, bannedAt: new Date(), isActive: true }]);
      setModerationStats({
        ...moderationStats,
        totalActiveBans: (moderationStats.totalActiveBans || 0) + 1
      });
      console.log('✅ IP banned:', ipAddress);
    } catch (err) {
      setError('Failed to ban IP');
      console.error(err);
    }
  };

  const handleCopyIP = (ip) => {
    navigator.clipboard.writeText(ip);
    alert(`✅ Copied IP: ${ip}`);
  };

  const handleUnbanIP = async (ipAddress) => {
    if (!ipAddress) {
      setError('Invalid IP address');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/admin/moderation/unban-ip`,
        { ipAddress },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setBannedIPs(bannedIPs.map(b => 
        b.ipAddress === ipAddress ? { ...b, isActive: false, unbannedAt: new Date() } : b
      ));
      setModerationStats({
        ...moderationStats,
        totalActiveBans: Math.max(0, (moderationStats.totalActiveBans || 1) - 1)
      });
      console.log('✅ IP unbanned:', ipAddress);
    } catch (err) {
      setError('Failed to unban IP');
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
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-6 py-3 rounded-lg font-semibold transition relative ${
              activeTab === 'moderation'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-red-300'
            }`}
          >
            🚨 Moderation ({moderationStats.totalFlaggedMessages || 0})
            {moderationStats.totalFlaggedMessages > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {moderationStats.totalFlaggedMessages}
              </span>
            )}
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar || u.profilePicture ? (
                            <img src={u.avatar || u.profilePicture} alt={u.username} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-bold border border-gray-200 shadow-sm">
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{u.username}</span>
                        </div>
                      </td>
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

        {/* Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <div className="text-3xl font-bold text-red-600">{moderationStats.totalFlaggedMessages || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Total Flagged Messages</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                <div className="text-3xl font-bold text-orange-600">{moderationStats.flaggedToday || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Flagged Today</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <div className="text-3xl font-bold text-yellow-600">{moderationStats.totalActiveBans || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Active IP Bans</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{bannedIPs.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Bans</div>
              </div>
            </div>

            {/* Banned IPs Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-red-700">🚫 Banned IP Addresses</h2>
              </div>
              <div className="overflow-x-auto">
                {bannedIPs.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">IP Address</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Reason</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Banned Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Violations</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {bannedIPs.map((ban) => (
                        <tr key={ban._id || ban.ipAddress} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-800 font-medium whitespace-nowrap">{ban.ipAddress}</span>
                              <button
                                onClick={() => handleCopyIP(ban.ipAddress)}
                                className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-semibold transition"
                                title="Copy IP address"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{ban.username || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                              {ban.reason}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {new Date(ban.bannedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-700 rounded-full font-bold text-sm">
                              {ban.violationCount || 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                ban.isActive
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {ban.isActive ? '🔴 Active' : '⚪ Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {ban.isActive && (
                              <button
                                onClick={() => handleUnbanIP(ban.ipAddress)}
                                className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-semibold transition"
                              >
                                Unban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <p>✅ No banned IPs. Your chat is safe!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Flagged Messages Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200 px-6 py-4">
                <h2 className="text-xl font-bold text-yellow-700">⚠️ Flagged Messages (Showing IP Addresses for Instant Ban)</h2>
                <p className="text-xs text-gray-600 mt-1">Abuse detected - IP addresses visible immediately for quick action</p>
              </div>
              {flaggedMessages && flaggedMessages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">IP Address</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Username</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Message</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Bad Words</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Room</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {flaggedMessages.map((msg) => (
                        <tr key={msg._id} className="hover:bg-yellow-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-3 py-2 bg-red-100 text-red-700 rounded font-mono font-bold text-sm border border-red-300 whitespace-nowrap">
                                {msg.ipAddress || 'N/A'}
                              </span>
                              {msg.ipAddress && (
                                <button
                                  onClick={() => handleCopyIP(msg.ipAddress)}
                                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-semibold transition"
                                  title="Copy IP address"
                                >
                                  📋
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-800">{msg.senderUsername || 'Unknown'}</td>
                          <td className="px-6 py-4 text-gray-700 text-sm max-w-xs truncate italic">"{msg.content}"</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {msg.flaggedWords && msg.flaggedWords.length > 0 ? (
                                msg.flaggedWords.map((word, i) => (
                                  <span key={i} className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-semibold">
                                    {word}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {msg.room?.name ? `#${msg.room.name}` : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">
                            {new Date(msg.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleBanIP(msg.ipAddress, 'Profanity violation')}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition shadow hover:shadow-md"
                              title="Ban this IP address immediately"
                            >
                              Ban IP
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>✅ No flagged messages. Great job keeping chat clean!</p>
                </div>
              )}
            </div>

            {/* Recent Flagged Messages */}
            {moderationStats.recentFlaggedMessages && moderationStats.recentFlaggedMessages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200 px-6 py-4">
                  <h2 className="text-xl font-bold text-yellow-700">⚠️ Recent Flagged Messages</h2>
                </div>
                <div className="space-y-4 p-6">
                  {moderationStats.recentFlaggedMessages.map((msg, idx) => (
                    <div key={idx} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-800">{msg.sender?.username || 'Unknown'}</div>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 mb-3 italic">"{msg.content}"</div>
                      {msg.flaggedWords && msg.flaggedWords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.flaggedWords.map((word, i) => (
                            <span key={i} className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                              {word}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        {msg.sender && (
                          <button
                            onClick={() => handleBanIP(msg.ipAddress, 'Flagged message content')}
                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded font-semibold transition"
                          >
                            Ban IP
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
