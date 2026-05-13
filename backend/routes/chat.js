// routes/chat.js
const express = require('express');
const chatRouter = express.Router();
const { protect } = require('../middleware/auth');
const { ChatMessage } = require('../models');

chatRouter.get('/:auctionId/:recipientId', protect, async (req, res) => {
  const { auctionId, recipientId } = req.params;
  const messages = await ChatMessage.find({
    auction: auctionId,
    $or: [
      { sender: req.user._id, recipient: recipientId },
      { sender: recipientId, recipient: req.user._id },
    ],
  }).populate('sender', 'name avatar').sort('createdAt').limit(100);
  await ChatMessage.updateMany({ auction: auctionId, sender: recipientId, recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, data: messages });
});

chatRouter.get('/conversations/list', protect, async (req, res) => {
  const conversations = await ChatMessage.aggregate([
    { $match: { $or: [{ sender: req.user._id }, { recipient: req.user._id }] } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: { auction: '$auction', other: { $cond: [{ $eq: ['$sender', req.user._id] }, '$recipient', '$sender'] } }, lastMessage: { $first: '$$ROOT' }, unreadCount: { $sum: { $cond: [{ $and: [{ $eq: ['$recipient', req.user._id] }, { $eq: ['$isRead', false] }] }, 1, 0] } } } },
    { $limit: 20 },
  ]);
  res.json({ success: true, data: conversations });
});

module.exports = chatRouter;
