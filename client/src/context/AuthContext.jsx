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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
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

