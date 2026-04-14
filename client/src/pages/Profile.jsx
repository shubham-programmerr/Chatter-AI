import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    dob: ''
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFormData({
        username: res.data.username,
        email: res.data.email,
        phone: res.data.phone || '',
        dob: res.data.dob ? res.data.dob.split('T')[0] : ''
      });
      
      if (res.data.profilePicture) {
        setPreviewPic(res.data.profilePicture);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setProfilePic(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let profilePictureUrl = previewPic;

      // Upload image if changed
      if (profilePic) {
        const formDataImg = new FormData();
        formDataImg.append('file', profilePic);
        formDataImg.append('upload_preset', 'chatterai'); // Update with your Cloudinary preset

        try {
          const cloudRes = await axios.post(
            'https://api.cloudinary.com/v1_1/duhqpjvmu/image/upload',
            formDataImg
          );
          profilePictureUrl = cloudRes.data.secure_url;
        } catch (imgErr) {
          // If Cloudinary fails, use base64 (for local testing)
          console.log('Cloudinary upload skipped, using local image');
          profilePictureUrl = previewPic;
        }
      }

      // Update profile
      const res = await axios.put(
        `${API_URL}/profile`,
        {
          ...formData,
          profilePicture: profilePictureUrl
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Profile updated successfully! 🎉');
      console.log('✅ Profile updated:', res.data);
      setProfilePic(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setError(errorMsg);
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-3xl">👤</div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-xs text-gray-500 font-medium">Edit your account information</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg transition font-medium shadow-md hover:shadow-lg"
          >
            ← Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Picture Section */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {previewPic ? (
                  <img
                    src={previewPic}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-5xl border-4 border-blue-200 shadow-lg">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <span className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg cursor-pointer font-medium transition shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95">
                    📸 Choose Image
                  </span>
                </label>
                <p className="text-sm text-gray-600">Max file size: 5MB (JPG, PNG, GIF)</p>
                {profilePic && (
                  <p className="text-sm text-blue-600 font-medium mt-2">✓ Image selected</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter your username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter your email"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-between items-center pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              🚪 Logout
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-lg transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              {saving ? '💾 Saving...' : '✅ Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Profile;
