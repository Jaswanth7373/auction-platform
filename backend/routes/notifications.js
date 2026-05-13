// routes/notifications.js
const express = require('express');
const notifRouter = express.Router();
const { protect } = require('../middleware/auth');
const { Notification } = require('../models');

notifRouter.get('/', protect, async (req, res) => {
  const notifs = await Notification.find({ recipient: req.user._id }).sort('-createdAt').limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, data: notifs, unreadCount });
});
notifRouter.put('/read-all', protect, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read.' });
});
notifRouter.put('/:id/read', protect, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.json({ success: true });
});
module.exports = notifRouter;
