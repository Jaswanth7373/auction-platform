const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;
const connectedUsers = new Map(); // userId -> Set of socketIds
const auctionRooms = new Map(); // auctionId -> Set of userIds

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      socket.userId = null; // Allow unauthenticated (view-only)
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
    } catch {
      socket.userId = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: ${socket.id}, User: ${userId || 'anonymous'}`);

    // Track connected users
    if (userId) {
      if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
      connectedUsers.get(userId).add(socket.id);
    }

    // =================== AUCTION ROOM EVENTS ===================

    // Join auction room for live updates
    socket.on('join_auction', (auctionId) => {
      socket.join(`auction:${auctionId}`);
      if (userId) {
        if (!auctionRooms.has(auctionId)) auctionRooms.set(auctionId, new Set());
        auctionRooms.get(auctionId).add(userId);
      }
      const viewerCount = io.sockets.adapter.rooms.get(`auction:${auctionId}`)?.size || 0;
      io.to(`auction:${auctionId}`).emit('viewer_count', { auctionId, count: viewerCount });
      logger.info(`User ${userId || 'anon'} joined auction room: ${auctionId}`);
    });

    // Leave auction room
    socket.on('leave_auction', (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      if (userId && auctionRooms.has(auctionId)) {
        auctionRooms.get(auctionId).delete(userId);
      }
      const viewerCount = io.sockets.adapter.rooms.get(`auction:${auctionId}`)?.size || 0;
      io.to(`auction:${auctionId}`).emit('viewer_count', { auctionId, count: viewerCount });
    });

    // =================== CHAT EVENTS ===================

    socket.on('join_chat', ({ auctionId, recipientId }) => {
      if (!userId) return;
      const chatRoom = [userId, recipientId].sort().join(':');
      socket.join(`chat:${chatRoom}:${auctionId}`);
    });

    socket.on('send_message', async ({ auctionId, recipientId, message }) => {
      if (!userId || !message?.trim()) return;
      try {
        const { ChatMessage } = require('../models');
        const chatMsg = await ChatMessage.create({
          auction: auctionId, sender: userId, recipient: recipientId, message: message.trim()
        });
        await chatMsg.populate('sender', 'name avatar');

        const chatRoom = [userId, recipientId].sort().join(':');
        io.to(`chat:${chatRoom}:${auctionId}`).emit('new_message', chatMsg);
      } catch (err) {
        logger.error(`Chat message error: ${err.message}`);
      }
    });

    // Typing indicator
    socket.on('typing', ({ auctionId, recipientId, isTyping }) => {
      if (!userId) return;
      const chatRoom = [userId, recipientId].sort().join(':');
      socket.to(`chat:${chatRoom}:${auctionId}`).emit('user_typing', { userId, isTyping });
    });

    // =================== NOTIFICATION EVENTS ===================

    socket.on('join_notifications', () => {
      if (!userId) return;
      socket.join(`notifications:${userId}`);
    });

    // =================== ADMIN EVENTS ===================

    socket.on('join_admin', () => {
      if (socket.userRole !== 'admin') return;
      socket.join('admin');
    });

    // =================== DISCONNECT ===================

    socket.on('disconnect', () => {
      if (userId && connectedUsers.has(userId)) {
        connectedUsers.get(userId).delete(socket.id);
        if (connectedUsers.get(userId).size === 0) connectedUsers.delete(userId);
      }

      // Update viewer counts for all auction rooms user was in
      socket.rooms.forEach((room) => {
        if (room.startsWith('auction:')) {
          const auctionId = room.replace('auction:', '');
          const viewerCount = io.sockets.adapter.rooms.get(room)?.size || 0;
          io.to(room).emit('viewer_count', { auctionId, count: viewerCount });
        }
      });

      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => io;

// Emit bid update to all users in auction room
const emitBidUpdate = (auctionId, bidData) => {
  if (!io) return;
  io.to(`auction:${auctionId}`).emit('bid_update', bidData);
};

// Emit auction status update
const emitAuctionUpdate = (auctionId, data) => {
  if (!io) return;
  io.to(`auction:${auctionId}`).emit('auction_update', data);
};

// Emit notification to specific user
const emitNotification = (userId, notification) => {
  if (!io) return;
  io.to(`notifications:${userId}`).emit('new_notification', notification);
};

// Emit to admin room
const emitAdminUpdate = (event, data) => {
  if (!io) return;
  io.to('admin').emit(event, data);
};

// Get online status of user
const isUserOnline = (userId) => connectedUsers.has(userId?.toString());

// Get viewers in auction
const getAuctionViewers = (auctionId) => auctionRooms.get(auctionId)?.size || 0;

module.exports = {
  initSocket, getIO, emitBidUpdate, emitAuctionUpdate,
  emitNotification, emitAdminUpdate, isUserOnline, getAuctionViewers,
};
