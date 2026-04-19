import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RoomSettings = ({ room, token, onUpdate, onClose, navigate }) => {
  // Get initial password from localStorage only (never from room.password which is hashed)
  const getInitialPassword = () => {
    const stored = localStorage.getItem(`room_password_${room._id}`);
    return stored || '';
  };

  const [formData, setFormData] = useState({
    name: room.name || '',
    description: room.description || '',
    isPrivate: room.isPrivate || false,
    roomPassword: getInitialPassword()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savedPassword, setSavedPassword] = useState('');
  const [showSavedPassword, setShowSavedPassword] = useState(false);

  // Load password from localStorage when component mounts or room changes
  useEffect(() => {
    const stored = localStorage.getItem(`room_password_${room._id}`);
    if (stored) {
      setFormData(prev => ({
        ...prev,
        roomPassword: stored
      }));
    }
  }, [room._id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        description: formData.description,
        isPrivate: formData.isPrivate
      };

      // Only send password if it's been changed and is not empty
      if (formData.roomPassword) {
        updateData.password = formData.roomPassword;
      }

      // If making room public, remove password
      if (!formData.isPrivate && room.isPrivate) {
        updateData.password = null;
      }

      // Handle password changes
      if (!formData.isPrivate) {
        // Clear password from localStorage when making room public
        localStorage.removeItem(`room_password_${room._id}`);
      } else if (formData.roomPassword) {
        // Store password in localStorage
        localStorage.setItem(`room_password_${room._id}`, formData.roomPassword);
      }

      const response = await axios.put(
        `${API_URL}/rooms/${room._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Save the password so user can see it after saving
      if (formData.roomPassword) {
        setSavedPassword(formData.roomPassword);
        setShowSavedPassword(true);
        // Store password in localStorage for persistence
        localStorage.setItem(`room_password_${room._id}`, formData.roomPassword);
        // Auto close after 8 seconds to give user time to copy
        setTimeout(() => {
          onClose();
        }, 8000);
      } else {
        setSuccess('✅ Room settings updated successfully!');
        onUpdate(response.data);
        // Close after 2 seconds if no password
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update room';
      setError(`❌ ${errorMsg}`);
      console.error('Settings update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `${API_URL}/rooms/${room._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setSuccess('✅ Room deleted successfully!');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to delete room';
      setError(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-xl font-bold">Room Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            title="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <p className="text-green-700 font-semibold text-sm mb-2">{success}</p>
            </div>
          )}

          {/* Password Display - Only after saving with password */}
          {showSavedPassword && savedPassword && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-400 rounded-lg p-4 shadow-lg">
              <p className="text-green-700 font-bold text-base mb-3">✅ Room Password Saved!</p>
              <div className="bg-white border-2 border-green-400 rounded p-4">
                <p className="text-xs text-gray-600 mb-2 font-semibold">📝 YOUR ROOM PASSWORD:</p>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={savedPassword}
                    readOnly
                    className="flex-1 text-3xl font-mono font-bold text-green-600 bg-green-50 px-3 py-3 rounded border-2 border-green-300 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(savedPassword);
                      alert('✅ Password copied to clipboard!');
                    }}
                    className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition"
                    title="Copy password to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="text-xs text-gray-600 font-semibold">💡 Share this password with users who want to join this room</p>
                <p className="text-xs text-gray-500 mt-2">Window closes automatically in 8 seconds...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Room Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📝 Room Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📄 Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What's this room about?"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none bg-gray-50"
              rows="3"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                className="w-5 h-5 cursor-pointer accent-purple-600"
              />
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span>🔒</span>
                <span>Make this room private</span>
              </span>
            </label>
            <p className="text-xs text-gray-600 mt-2 ml-8">
              Only room members can see and join this room
            </p>
          </div>

          {/* Password Field */}
          {formData.isPrivate && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>🔐</span>
                <span>Room Password (Optional)</span>
              </label>
              <input
                type="text"
                name="roomPassword"
                value={formData.roomPassword}
                onChange={handleChange}
                placeholder="Enter a PIN (e.g., 1234) or leave empty"
                autoComplete="off"
                spellCheck="false"
                className="w-full border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-sm font-semibold"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Leave empty for no password, or set a PIN that users must enter to join
              </p>
            </div>
          )}

          {/* Room Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">ℹ️ Room Info</p>
            <div className="space-y-1 text-xs text-gray-700">
              <p>👥 Members: <span className="font-semibold">{room.users?.length || 0}</span></p>
              <p>🔑 Owner: <span className="font-semibold">{room.owner?.username || 'Unknown'}</span></p>
              <p>📅 Created: <span className="font-semibold">{new Date(room.createdAt).toLocaleDateString()}</span></p>
              {(room.passwordProtected || formData.isPrivate) && (
                <p>🔐 Status: <span className="font-semibold text-blue-600">Password Protected</span></p>
              )}
              {formData.isPrivate && formData.roomPassword && (
                <div className="mt-3 pt-3 border-t border-gray-300 bg-gradient-to-r from-green-50 to-green-100 p-3 rounded border border-green-300">
                  <p className="text-xs font-bold text-green-800 mb-2">🔐 Current Password:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border-2 border-green-400 rounded px-3 py-2">
                      <p className="font-mono font-bold text-green-600 text-base">{formData.roomPassword}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(formData.roomPassword);
                        alert('✅ Password copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded font-semibold transition text-sm whitespace-nowrap"
                      title="Copy password"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <p className="text-xs text-green-700 mt-2">💡 Share this password with others</p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 transform hover:scale-105 active:scale-95"
          >
            {loading ? '💾 Saving...' : '💾 Save Changes'}
          </button>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-5">
            <p className="text-xs font-semibold text-red-600 mb-3">⚠️ Danger Zone</p>
            
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 rounded-lg border border-red-200 transition"
              >
                🗑️ Delete Room
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-700 mb-3">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteRoom}
                    disabled={loading}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition font-medium text-sm disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomSettings;
