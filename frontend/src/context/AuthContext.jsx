import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.data.success) {
            setUser(res.data.user);
            setStats(res.data.stats);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleAutoLogout = () => {
      setUser(null);
      setToken(null);
      setStats(null);
    };

    window.addEventListener('auth:logout', handleAutoLogout);
    return () => window.removeEventListener('auth:logout', handleAutoLogout);
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message };
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
    return { success: false, message: res.data.message };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setStats(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.data.message };
  };

  const refreshMe = async () => {
    if (token) {
      try {
        const res = await authApi.getMe();
        if (res.data.success) {
          setUser(res.data.user);
          setStats(res.data.stats);
        }
      } catch (e) {
        // ignore
      }
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!user,
    isStudent: user?.role === 'STUDENT_PROFESSIONAL',
    isProvider: user?.role === 'SERVICE_PROVIDER',
    isAdmin: user?.role === 'ADMIN',
    loading,
    stats,
    login,
    register,
    logout,
    updateProfile,
    refreshMe
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
