import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await notificationAPI.getAll();
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();

    // Poll every 30s as fallback
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  // Real-time socket notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (notif) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
      setUnreadCount((prev) => prev + 1);

      // Show toast
      const icons = {
        bid_placed: '🔨', outbid: '⚠️', auction_won: '🎉',
        payment_received: '💳', seller_verified: '✅', new_follower: '👥',
      };
      toast(notif.message, {
        icon: icons[notif.type] || '🔔',
        duration: 5000,
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' },
      });
    };

    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [isAuthenticated]);

  const markAllRead = useCallback(async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback(async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markAllRead, markRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
