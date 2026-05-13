const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Seller = require('../models/Seller');
const Auction = require('../models/Auction');
const { Bid, Payment, Notification, Review, Watchlist } = require('../models');
const { uploadProfileImage } = require('../config/cloudinary');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

// =================== USER CONTROLLER ===================

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id || req.user._id).lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  delete user.password; delete user.otp; delete user.passwordResetToken;
  res.json({ success: true, data: user });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, phone, address, preferences } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (phone) updates.phone = phone;
  if (address) updates.address = JSON.parse(address);
  if (preferences) updates.preferences = JSON.parse(preferences);
  if (req.file) updates.avatar = req.file.path || req.file.secure_url || `/uploads/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  await cacheDel(`user:${req.user._id}`);
  res.json({ success: true, message: 'Profile updated.', data: user.toPublicJSON() });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!await user.comparePassword(currentPassword)) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully.' });
});

const getUserBids = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const bids = await Bid.find({ bidder: req.user._id })
    .populate({ path: 'auction', select: 'title images status endTime currentBid' })
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  const total = await Bid.countDocuments({ bidder: req.user._id });
  res.json({ success: true, data: bids, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const getUserWins = asyncHandler(async (req, res) => {
  const wins = await Auction.find({ winner: req.user._id })
    .populate('seller', 'businessName logo')
    .sort('-updatedAt');
  res.json({ success: true, data: wins });
});

const getWatchlist = asyncHandler(async (req, res) => {
  const items = await Watchlist.find({ user: req.user._id })
    .populate({ path: 'auction', populate: { path: 'seller', select: 'businessName logo' } })
    .sort('-addedAt');
  res.json({ success: true, data: items });
});

const addToWatchlist = asyncHandler(async (req, res) => {
  const { auctionId } = req.params;
  const existing = await Watchlist.findOne({ user: req.user._id, auction: auctionId });
  if (existing) return res.status(400).json({ success: false, message: 'Already in watchlist.' });
  const item = await Watchlist.create({ user: req.user._id, auction: auctionId });
  await Auction.findByIdAndUpdate(auctionId, { $inc: { watchCount: 1 } });
  res.status(201).json({ success: true, message: 'Added to watchlist.', data: item });
});

const removeFromWatchlist = asyncHandler(async (req, res) => {
  await Watchlist.findOneAndDelete({ user: req.user._id, auction: req.params.auctionId });
  await Auction.findByIdAndUpdate(req.params.auctionId, { $inc: { watchCount: -1 } });
  res.json({ success: true, message: 'Removed from watchlist.' });
});

// =================== SELLER CONTROLLER ===================

const getSellerProfile = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.params.id).populate('user', 'name avatar email createdAt').lean();
  if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });
  delete seller.bankDetails;
  res.json({ success: true, data: seller });
});

const updateSellerProfile = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found.' });

  const { businessName, description, website, businessType, categories, socialLinks } = req.body;
  const updates = {};
  if (businessName) updates.businessName = businessName;
  if (description) updates.description = description;
  if (website) updates.website = website;
  if (businessType) updates.businessType = businessType;
  if (categories) updates.categories = JSON.parse(categories);
  if (socialLinks) updates.socialLinks = JSON.parse(socialLinks);
  if (req.file) updates.logo = req.file.path || `/uploads/${req.file.filename}`;

  const updated = await Seller.findByIdAndUpdate(seller._id, updates, { new: true }).populate('user', 'name avatar');
  res.json({ success: true, message: 'Seller profile updated.', data: updated });
});

const getSellerDashboard = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found.' });

  const [activeAuctions, recentBids, recentPayments, allAuctions] = await Promise.all([
    Auction.find({ seller: seller._id, status: 'active' }).limit(5),
    Bid.find({ auction: { $in: await Auction.distinct('_id', { seller: seller._id }) } })
      .populate('bidder', 'name avatar')
      .populate('auction', 'title')
      .sort('-createdAt').limit(10),
    Payment.find({ seller: seller._id }).sort('-createdAt').limit(5).populate('buyer', 'name').populate('auction', 'title'),
    Auction.find({ seller: seller._id }),
  ]);

  // Calculate monthly revenue for chart
  const revenueByMonth = {};
  for (const payment of await Payment.find({ seller: seller._id, status: 'completed' })) {
    const month = payment.createdAt.toISOString().slice(0, 7);
    revenueByMonth[month] = (revenueByMonth[month] || 0) + payment.sellerAmount;
  }

  res.json({
    success: true, data: {
      seller,
      stats: {
        totalAuctions: seller.totalAuctions, activeAuctions: seller.activeAuctions,
        completedAuctions: seller.completedAuctions, totalRevenue: seller.totalRevenue,
        rating: seller.rating, reviewCount: seller.reviewCount,
      },
      activeAuctions, recentBids, recentPayments,
      revenueByMonth: Object.entries(revenueByMonth).map(([month, revenue]) => ({ month, revenue })),
    },
  });
});

const getSellerAuctions = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  const { status, page = 1, limit = 10 } = req.query;
  const query = { seller: seller._id };
  if (status) query.status = status;
  const [auctions, total] = await Promise.all([
    Auction.find(query).sort('-createdAt').skip((Number(page) - 1) * 10).limit(Number(limit)),
    Auction.countDocuments(query),
  ]);
  res.json({ success: true, data: auctions, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const submitVerification = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });
  const docs = (req.files || []).map((f) => ({ docType: req.body.docType || 'identity', docUrl: f.path || `/uploads/${f.filename}`, uploadedAt: new Date() }));
  seller.verificationDocuments.push(...docs);
  seller.verificationStatus = 'under_review';
  seller.policiesAgreed = req.body.policiesAgreed === 'true';
  seller.policiesAgreedAt = new Date();
  await seller.save();
  res.json({ success: true, message: 'Verification documents submitted. We will review within 2-3 business days.' });
});

// =================== ADMIN CONTROLLER ===================

const getAdminDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalSellers, totalAuctions, totalRevenue, recentUsers, recentAuctions, pendingSellers] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    Seller.countDocuments(),
    Auction.countDocuments(),
    Payment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$platformFee' } } }]),
    User.find().sort('-createdAt').limit(5).select('name email role createdAt avatar'),
    Auction.find().sort('-createdAt').limit(5).populate('seller', 'businessName'),
    Seller.find({ verificationStatus: 'under_review' }).populate('user', 'name email').limit(10),
  ]);

  const activeAuctions = await Auction.countDocuments({ status: 'active' });
  const completedPayments = await Payment.countDocuments({ status: 'completed' });

  // Revenue by month
  const revenueData = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, revenue: { $sum: '$platformFee' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }, { $limit: 12 },
  ]);

  res.json({
    success: true, data: {
      stats: {
        totalUsers, totalSellers, totalAuctions, activeAuctions,
        platformRevenue: totalRevenue[0]?.total || 0, completedPayments,
      },
      recentUsers, recentAuctions, pendingSellers, revenueData,
    },
  });
});

const manageUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, status } = req.query;
  const query = { role: { $ne: 'admin' } };
  if (role) query.role = role;
  if (status === 'banned') query.isBanned = true;
  if (status === 'active') query.isActive = true;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

  const [users, total] = await Promise.all([
    User.find(query).select('-password -otp').sort('-createdAt').skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason, ban } = req.body;
  const user = await User.findByIdAndUpdate(userId, { isBanned: ban !== false, banReason: reason || 'Platform violation' }, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, message: `User ${ban !== false ? 'banned' : 'unbanned'}.`, data: user });
});

const verifySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { status, notes } = req.body;
  const seller = await Seller.findByIdAndUpdate(
    sellerId,
    {
      verificationStatus: status,
      verificationBadge: status === 'verified',
      verifiedAt: status === 'verified' ? new Date() : null,
    },
    { new: true }
  ).populate('user', 'name email');

  if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });

  // Notify seller
  await Notification.create({
    recipient: seller.user._id, type: 'seller_verified',
    title: status === 'verified' ? '✅ Seller Verified!' : '❌ Verification Update',
    message: status === 'verified' ? 'Your seller account has been verified. You can now create auctions.' : `Verification status: ${status}. ${notes || ''}`,
  });

  // Update user role if verified
  if (status === 'verified') await User.findByIdAndUpdate(seller.user._id, { role: 'seller' });

  res.json({ success: true, message: `Seller ${status}.`, data: seller });
});

const manageAuctions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category } = req.query;
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;

  const [auctions, total] = await Promise.all([
    Auction.find(query).populate('seller', 'businessName').sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit)).limit(Number(limit)),
    Auction.countDocuments(query),
  ]);
  res.json({ success: true, data: auctions, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// =================== PAYMENT CONTROLLER ===================

const createPaymentIntent = asyncHandler(async (req, res) => {
  const { auctionId } = req.body;
  const auction = await Auction.findById(auctionId).populate('seller');
  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
  if (auction.winner?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You are not the winner of this auction.' });
  }

  const existing = await Payment.findOne({ auction: auctionId, buyer: req.user._id, status: { $ne: 'failed' } });
  if (existing?.status === 'completed') return res.status(400).json({ success: false, message: 'Payment already completed.' });

  const commissionRate = auction.seller.commissionRate || 10;
  const platformFee = (auction.winningBid * commissionRate) / 100;
  const sellerAmount = auction.winningBid - platformFee;
  const totalAmount = Math.round((auction.winningBid) * 100); // cents

  let paymentIntent;
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_secret_key') {
    paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: { auctionId: auctionId.toString(), buyerId: req.user._id.toString() },
    });
  }

  const payment = await Payment.create({
    auction: auctionId, buyer: req.user._id, seller: auction.seller._id,
    amount: auction.winningBid, platformFee, sellerAmount,
    stripePaymentIntentId: paymentIntent?.id || 'demo_' + Date.now(),
    dueBy: new Date(Date.now() + 48 * 60 * 60 * 1000),
  });

  res.json({
    success: true, data: {
      clientSecret: paymentIntent?.client_secret || 'demo_secret',
      payment, amount: auction.winningBid, platformFee, sellerAmount,
    },
  });
});

const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId, paymentId } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });

  payment.status = 'completed';
  payment.paidAt = new Date();
  payment.stripePaymentIntentId = paymentIntentId || payment.stripePaymentIntentId;
  await payment.save();

  await Auction.findByIdAndUpdate(payment.auction, { payment: payment._id });
  await Seller.findByIdAndUpdate(payment.seller, { $inc: { totalRevenue: payment.sellerAmount, pendingRevenue: payment.sellerAmount } });

  await Notification.create({
    recipient: payment.buyer, type: 'payment_received', title: 'Payment Confirmed',
    message: `Your payment of $${payment.amount.toFixed(2)} has been confirmed.`,
  });

  res.json({ success: true, message: 'Payment confirmed.', data: payment });
});

const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ buyer: req.user._id })
    .populate('auction', 'title images').populate('seller', 'businessName').sort('-createdAt');
  res.json({ success: true, data: payments });
});

// =================== REVIEW CONTROLLER ===================

const createReview = asyncHandler(async (req, res) => {
  const { sellerId, auctionId, rating, title, comment } = req.body;
  const existing = await Review.findOne({ reviewer: req.user._id, auction: auctionId });
  if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this auction.' });

  const review = await Review.create({ reviewer: req.user._id, seller: sellerId, auction: auctionId, rating, title, comment });

  // Update seller rating
  const reviews = await Review.find({ seller: sellerId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Seller.findByIdAndUpdate(sellerId, { rating: avgRating.toFixed(1), reviewCount: reviews.length });

  res.status(201).json({ success: true, message: 'Review submitted.', data: review });
});

const getSellerReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const reviews = await Review.find({ seller: req.params.sellerId, isHidden: false })
    .populate('reviewer', 'name avatar').sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
  const total = await Review.countDocuments({ seller: req.params.sellerId });
  res.json({ success: true, data: reviews, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

module.exports = {
  getUserProfile, updateUserProfile, changePassword, getUserBids, getUserWins,
  getWatchlist, addToWatchlist, removeFromWatchlist,
  getSellerProfile, updateSellerProfile, getSellerDashboard, getSellerAuctions, submitVerification,
  getAdminDashboard, manageUsers, banUser, verifySeller, manageAuctions,
  createPaymentIntent, confirmPayment, getPaymentHistory,
  createReview, getSellerReviews,
};
