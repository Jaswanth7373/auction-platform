import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Auction room helpers
export const joinAuctionRoom = (auctionId) => socket?.emit('join_auction', auctionId);
export const leaveAuctionRoom = (auctionId) => socket?.emit('leave_auction', auctionId);

// Notification room
export const joinNotifications = () => socket?.emit('join_notifications');

// Chat helpers
export const joinChat = (auctionId, recipientId) => socket?.emit('join_chat', { auctionId, recipientId });
export const sendChatMessage = (data) => socket?.emit('send_message', data);
export const emitTyping = (data) => socket?.emit('typing', data);

// Admin room
export const joinAdmin = () => socket?.emit('join_admin');

export default { initSocket, getSocket, disconnectSocket };
