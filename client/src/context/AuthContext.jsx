import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('localhost', window.location.hostname !== 'localhost' ? window.location.hostname : 'localhost');

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [ipBanned, setIpBanned] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Check IP ban status periodically
  useEffect(() => {
    if (!token) return;

    const checkIPBan = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/check-ip-ban`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout
        });

        if (response.data?.isBanned === true) {
          console.warn('🚫 User IP is banned. Auto-logging out...');
          setIpBanned(true);
          logout();
          alert('⛔ Your IP address has been banned due to policy violations. Please contact support.');
        } else {
          setIpBanned(false);
        }
      } catch (error) {
        // Only logout if we get a clear 403 with isBanned flag
        if (error.response?.status === 403 && error.response?.data?.isBanned === true) {
          console.warn('🚫 User IP is banned. Auto-logging out...');
          setIpBanned(true);
          logout();
          alert('⛔ Your IP address has been banned due to policy violations. Please contact support.');
        } else if (error.response?.status === 404) {
          // Endpoint doesn't exist yet - silently continue
          console.log('ℹ️ IP ban check endpoint not available yet');
        } else {
          // Any other error - just log it, don't logout user
          console.log('ℹ️ IP ban check skipped:', error.message);
        }
      }
    };

    // Check immediately (but with small delay to let login complete)
    const initialTimeout = setTimeout(checkIPBan, 1000);

    // Check every 60 seconds (less frequent)
    const interval = setInterval(checkIPBan, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [token]);

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });

      const { token, ...userData } = response.data;
      setToken(token);
      setUser(userData);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, ...userData } = response.data;
      setToken(token);
      setUser(userData);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const googleLogin = async (credential) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        credential
      });

      const { token, ...userData } = response.data;
      setToken(token);
      setUser(userData);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      return userData;
    } catch (error) {
      console.error('Google login error:', error);
      throw error.response?.data?.message || 'Google login failed';
    }
  };

  const value = {
    user,
    token,
    loading,
    ipBanned,
    register,
    login,
    googleLogin,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

