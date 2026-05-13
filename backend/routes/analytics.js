const express = require('express');
const router = express.Router();
const { protect, isSeller, isAdmin } = require('../middleware/auth');
const Auction = require('../models/Auction');
const { Bid, Payment } = require('../models');
const Seller = require('../models/Seller');

// Platform-wide stats (public)
router.get('/stats', async (req, res) => {
  const [totalAuctions, activeAuctions, totalBids, result] = await Promise.all([
    Auction.countDocuments(),
    Auction.countDocuments({ status: 'active' }),
    Bid.countDocuments(),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ success: true, data: { totalAuctions, activeAuctions, totalBids, totalVolume: result[0]?.total || 0 } });
});

// Seller analytics
router.get('/seller', protect, isSeller, async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

  const [revenueData, topAuctions, categoryBreakdown] = await Promise.all([
    Payment.aggregate([
      { $match: { seller: seller._id, status: 'completed' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$sellerAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }, { $limit: 30 },
    ]),
    Auction.find({ seller: seller._id }).sort('-bidCount').limit(5).select('title currentBid bidCount status'),
    Auction.aggregate([
      { $match: { seller: seller._id } },
      { $group: { _id: '$category', count: { $sum: 1 }, totalRevenue: { $sum: '$winningBid' } } },
    ]),
  ]);

  res.json({ success: true, data: { revenueData, topAuctions, categoryBreakdown } });
});

// Admin analytics
router.get('/admin', protect, isAdmin, async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [dailyRevenue, categoryStats, userGrowth] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$platformFee' }, volume: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Auction.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgBid: { $avg: '$currentBid' }, totalVolume: { $sum: '$winningBid' } } },
      { $sort: { count: -1 } },
    ]),
    require('../models/User').default?.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]) || Promise.resolve([]),
  ]);

  res.json({ success: true, data: { dailyRevenue, categoryStats, userGrowth } });
});

module.exports = router;
