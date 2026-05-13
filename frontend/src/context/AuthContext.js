import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import { initSocket, disconnectSocket, joinNotifications } from '../services/socket';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize user from localStorage + verify with server
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const { data } = await authAPI.getMe();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));

          // Init socket
          const sock = initSocket(token);
          sock.on('connect', () => joinNotifications());
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
      setInitialized(true);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    const sock = initSocket(data.token);
    sock.on('connect', () => joinNotifications());

    return data;
  }, []);

  const register = useCallback(async (userData) => {
    const { data } = await authAPI.register(userData);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
    toast.success('Logged out successfully');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, loading, initialized, isAuthenticated, isAdmin, isSeller,
      login, register, logout, updateUser, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
