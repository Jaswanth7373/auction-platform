const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const Seller = require('../models/Seller');
const User = require('../models/User');
const { Bid, Notification, Watchlist } = require('../models');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../config/redis');
const { emitBidUpdate, emitAuctionUpdate, emitNotification } = require('../socket/socketManager');
const { sendOutbidEmail, sendAuctionWonEmail } = require('../utils/emailUtils');
const logger = require('../utils/logger');    

// Helper to create notification
const createNotification = async (recipientId, type, title, message, data = {}, link = '') => {
  try {
    const notif = await Notification.create({ recipient: recipientId, type, title, message, data, link });
    emitNotification(recipientId.toString(), notif);
    return notif;
  } catch (err) {
    logger.error(`Notification error: ${err.message}`);
  }
};

// @desc    Get all auctions with filters
// @route   GET /api/auctions
// @access  Public
const getAuctions = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 12, category, status = 'active', search, minPrice, maxPrice,
    condition, sort = '-createdAt', featured, seller
  } = req.query;

  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (condition) query.condition = condition;
  if (featured === 'true') query.isFeatured = true;
  if (seller) query.seller = seller;
  if (minPrice || maxPrice) {
    query.currentBid = {};
    if (minPrice) query.currentBid.$gte = Number(minPrice);
    if (maxPrice) query.currentBid.$lte = Number(maxPrice);
  }
  if (search) query.$text = { $search: search };

  const cacheKey = `auctions:${JSON.stringify({ query, page, limit, sort })}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const skip = (Number(page) - 1) * Number(limit);
  const sortObj = search ? { score: { $meta: 'textScore' } } : {};
  const [auctions, total] = await Promise.all([
    Auction.find(query)
      .populate('seller', 'businessName verificationBadge logo rating user')
      .populate('currentBidder', 'name avatar')
      .sort(sortObj || sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Auction.countDocuments(query),
  ]);

  const result = {
    success: true,
    data: auctions,
    pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)), limit: Number(limit) },
  };

  await cacheSet(cacheKey, result, 60); // 1 min cache
  res.json(result);
});

// @desc    Get single auction
// @route   GET /api/auctions/:id
// @access  Public
const getAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate({
      path: 'seller',
      populate: { path: 'user', select: 'name avatar email' },
    })
    .populate('currentBidder', 'name avatar')
    .populate('winner', 'name avatar');

  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });

  // Increment view count (don't await)
  Auction.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

  // Get recent bids
  const recentBids = await Bid.find({ auction: req.params.id })
    .populate('bidder', 'name avatar')
    .sort('-createdAt')
    .limit(20)
    .lean();

  // Check if user has it watchlisted
  let isWatchlisted = false;
  if (req.user) {
    const wl = await Watchlist.findOne({ user: req.user._id, auction: req.params.id });
    isWatchlisted = !!wl;
  }

  res.json({ success: true, data: auction, recentBids, isWatchlisted });
});

// @desc    Create auction
// @route   POST /api/auctions
// @access  Seller
const createAuction = asyncHandler(async (req, res) => {
  // ===== DEBUG =====
  console.log('CREATE AUCTION CALLED');
  console.log('User ID:', req.user?._id);
  console.log('User Role:', req.user?.role);
  console.log('Body:', req.body);
  console.log('Files:', req.files?.length);
  // ===== END DEBUG =====

  let seller = await Seller.findOne({ user: req.user._id });
  console.log('Seller:', seller ? 'FOUND' : 'NOT FOUND');

  // Auto-create seller if missing
  if (!seller) {
    seller = await Seller.create({
      user: req.user._id,
      businessName: req.user.name || 'My Store',
      verificationStatus: 'verified',
      verificationBadge: true,
    });
    console.log('Auto-created seller:', seller._id);
  }

  const {
    title, description, category, subcategory, condition, startingBid, reservePrice,
    buyNowPrice, startTime, endTime, tags, location, shippingOptions, shippingIncluded,
    specifications, minimumBidIncrement, autoExtend
  } = req.body;

  // Process uploaded images
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const images = (req.files || []).map((file, idx) => ({
    url: file.secure_url || `${baseUrl}/uploads/${file.filename}`,
    publicId: file.filename || file.public_id || '',
    isPrimary: idx === 0,
  }));

  const auctionData = {
    seller: seller._id, title, description, category, subcategory, condition,
    startingBid: Number(startingBid), images, tags: tags ? JSON.parse(tags) : [],
    startTime: new Date(startTime), endTime: new Date(endTime),
    status: new Date(startTime) <= new Date() ? 'active' : 'scheduled',
    minimumBidIncrement: Number(minimumBidIncrement) || 1,
    autoExtend: autoExtend !== undefined ? Boolean(autoExtend) : true,
  };

  if (reservePrice) auctionData.reservePrice = Number(reservePrice);
  if (buyNowPrice) auctionData.buyNowPrice = Number(buyNowPrice);
  if (location) auctionData.location = JSON.parse(location);
  if (shippingOptions) auctionData.shippingOptions = JSON.parse(shippingOptions);
  if (specifications) auctionData.specifications = JSON.parse(specifications);
  if (shippingIncluded) auctionData.shippingIncluded = shippingIncluded === 'true';

  const auction = await Auction.create(auctionData);

  // Update seller stats
  await Seller.findByIdAndUpdate(seller._id, { $inc: { totalAuctions: 1, activeAuctions: 1 } });

  await cacheDelPattern('auctions:*');
  logger.info(`Auction created: ${auction._id} by seller ${seller._id}`);

  res.status(201).json({ success: true, message: 'Auction created successfully.', data: auction });
});

// @desc    Update auction
// @route   PUT /api/auctions/:id
// @access  Seller (owner)
const updateAuction = asyncHandler(async (req, res) => {
  const seller = await Seller.findOne({ user: req.user._id });
  const auction = await Auction.findOne({ _id: req.params.id, seller: seller?._id });

  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found or unauthorized.' });
  if (auction.status === 'active' && auction.bidCount > 0) {
    return res.status(400).json({ success: false, message: 'Cannot edit an auction with existing bids.' });
  }

  const updates = { ...req.body };
  if (req.files?.length) {
    const newImages = req.files.map((file, idx) => ({
      url: file.path || `/uploads/${file.filename}`,
      publicId: file.filename || '',
      isPrimary: idx === 0 && auction.images.length === 0,
    }));
    updates.images = [...auction.images, ...newImages];
  }

  const updated = await Auction.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  await cacheDelPattern('auctions:*');

  res.json({ success: true, message: 'Auction updated.', data: updated });
});

// @desc    Delete auction
// @route   DELETE /api/auctions/:id
// @access  Seller (owner) or Admin
const deleteAuction = asyncHandler(async (req, res) => {
  const seller = req.user.role === 'admin' ? null : await Seller.findOne({ user: req.user._id });
  const query = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, seller: seller?._id };
  const auction = await Auction.findOne(query);

  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
  if (auction.status === 'active' && auction.bidCount > 0 && req.user.role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Cannot delete an active auction with bids.' });
  }

  auction.status = 'cancelled';
  await auction.save();

  await cacheDelPattern('auctions:*');
  res.json({ success: true, message: 'Auction cancelled successfully.' });
});

// @desc    Place a bid
// @route   POST /api/auctions/:id/bid
// @access  Private (User)
const placeBid = asyncHandler(async (req, res) => {
  const { amount, isAutoBid, maxAutoBid } = req.body;
  const bidAmount = Number(amount);

  const auction = await Auction.findById(req.params.id).populate('currentBidder', 'name email');
  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
  if (auction.status !== 'active') return res.status(400).json({ success: false, message: 'This auction is not active.' });
  if (auction.endTime < new Date()) return res.status(400).json({ success: false, message: 'This auction has ended.' });

  // Check seller isn't bidding on their own auction
  const sellerUser = await Seller.findById(auction.seller);
  if (sellerUser?.user?.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot bid on your own auction.' });
  }

  const minimumBid = auction.currentBid + auction.minimumBidIncrement;
  if (bidAmount < minimumBid) {
    return res.status(400).json({ success: false, message: `Minimum bid is $${minimumBid.toFixed(2)}` });
  }

  const previousBidder = auction.currentBidder;
  const previousBid = auction.currentBid;

  // Handle auto-extend
  const bidTime = new Date();
  let timeExtended = false;
  if (auction.shouldAutoExtend(bidTime)) {
    auction.endTime = new Date(auction.endTime.getTime() + auction.extensionMinutes * 60 * 1000);
    auction.extensionCount += 1;
    timeExtended = true;
  }

  // Update auction
  auction.currentBid = bidAmount;
  auction.currentBidder = req.user._id;
  auction.bidCount += 1;
  if (auction.reservePrice && bidAmount >= auction.reservePrice) auction.isReservemet = true;
  auction.priceHistory.push({ price: bidAmount, timestamp: bidTime, bidder: req.user._id });

  await auction.save();

  // Mark previous bid as outbid
  if (previousBidder) {
    await Bid.findOneAndUpdate(
      { auction: auction._id, bidder: previousBidder._id, status: 'active' },
      { status: 'outbid', isWinning: false }
    );
  }

  // Create new bid record
  const bid = await Bid.create({
    auction: auction._id, bidder: req.user._id, amount: bidAmount,
    isWinning: true, isAutoBid: !!isAutoBid,
    maxAutoBid: maxAutoBid ? Number(maxAutoBid) : undefined,
    ipAddress: req.ip, userAgent: req.get('user-agent'),
  });

  await bid.populate('bidder', 'name avatar');

  // Emit real-time update
  const updatePayload = {
    auctionId: auction._id, currentBid: bidAmount, bidCount: auction.bidCount,
    currentBidder: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
    endTime: auction.endTime, timeExtended, bid,
  };
  emitBidUpdate(auction._id.toString(), updatePayload);

  // Notify previous bidder (outbid)
  if (previousBidder && previousBidder._id.toString() !== req.user._id.toString()) {
    await createNotification(
      previousBidder._id, 'outbid', 'You\'ve been outbid!',
      `Someone bid $${bidAmount.toFixed(2)} on "${auction.title}". Bid now to stay in!`,
      { auctionId: auction._id, newBid: bidAmount }, `/auctions/${auction._id}`
    );
    if (previousBidder.email) {
      sendOutbidEmail(previousBidder.email, previousBidder.name, auction, bidAmount).catch(() => {});
    }
  }

  // Notify watchlist users
  const watchlistEntries = await Watchlist.find({ auction: auction._id, user: { $ne: req.user._id } })
    .populate('user', 'name');
  for (const entry of watchlistEntries) {
    if (entry.notifyOnBid) {
      await createNotification(
        entry.user._id, 'bid_placed', 'New bid on watched item',
        `New bid of $${bidAmount.toFixed(2)} on "${auction.title}"`,
        { auctionId: auction._id }, `/auctions/${auction._id}`
      );
    }
  }

  // Handle Buy Now
  if (auction.buyNowPrice && bidAmount >= auction.buyNowPrice) {
    await endAuctionWithWinner(auction, req.user._id, bidAmount);
  }

  logger.info(`Bid placed: $${bidAmount} on auction ${auction._id} by user ${req.user._id}`);
  res.status(201).json({ success: true, message: 'Bid placed successfully!', data: { bid, auction: updatePayload } });
});

// Helper to finalize auction with a winner
const endAuctionWithWinner = async (auction, winnerId, winAmount) => {
  auction.status = 'sold';
  auction.winner = winnerId;
  auction.winningBid = winAmount;
  await auction.save();

  await Bid.findOneAndUpdate({ auction: auction._id, bidder: winnerId, status: 'active' }, { status: 'won', isWinning: true });

  const winner = await User.findById(winnerId);
  if (winner) {
    await createNotification(
      winnerId, 'auction_won', '🎉 You won an auction!',
      `Congratulations! You won "${auction.title}" with a bid of $${winAmount.toFixed(2)}`,
      { auctionId: auction._id }, `/dashboard/wins`
    );
    sendAuctionWonEmail(winner.email, winner.name, auction, winAmount).catch(() => {});
    await User.findByIdAndUpdate(winnerId, { $inc: { totalWins: 1 } });
  }

  emitAuctionUpdate(auction._id.toString(), { status: 'sold', winner: winnerId, winningBid: winAmount });
};

// @desc    Get featured auctions
// @route   GET /api/auctions/featured
// @access  Public
const getFeaturedAuctions = asyncHandler(async (req, res) => {
  const cached = await cacheGet('auctions:featured');
  if (cached) return res.json(cached);

  const auctions = await Auction.find({ status: 'active', isFeatured: true })
    .populate('seller', 'businessName verificationBadge logo rating')
    .sort('-createdAt')
    .limit(8)
    .lean();

  const result = { success: true, data: auctions };
  await cacheSet('auctions:featured', result, 120);
  res.json(result);
});

// @desc    Get auction bid history
// @route   GET /api/auctions/:id/bids
// @access  Public
const getAuctionBids = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const bids = await Bid.find({ auction: req.params.id })
    .populate('bidder', 'name avatar')
    .sort('-createdAt')
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await Bid.countDocuments({ auction: req.params.id });
  res.json({ success: true, data: bids, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// @desc    AI bid recommendation
// @route   GET /api/auctions/:id/recommendation
// @access  Private
const getBidRecommendation = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id).lean();
  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });

  const bids = await Bid.find({ auction: req.params.id }).sort('-amount').limit(50).lean();
  const userBids = await Bid.find({ auction: req.params.id, bidder: req.user._id }).sort('-amount').lean();

  // AI recommendation logic
  const timeLeft = Math.max(0, new Date(auction.endTime) - Date.now());
  const timeLeftHours = timeLeft / (1000 * 60 * 60);
  const bidVelocity = auction.bidCount / Math.max(1, (Date.now() - new Date(auction.startTime)) / (1000 * 60 * 60));

  let recommendedBid = auction.currentBid + auction.minimumBidIncrement;
  let strategy = 'normal';
  let confidence = 70;
  let reasoning = '';

  if (timeLeftHours < 1 && bidVelocity > 5) {
    // Hot auction near end - bid more aggressively
    recommendedBid = auction.currentBid * 1.1;
    strategy = 'aggressive';
    confidence = 85;
    reasoning = 'High bidding activity near auction end. Recommend aggressive bidding to secure the win.';
  } else if (bids.length < 3) {
    // Low competition
    recommendedBid = auction.currentBid + auction.minimumBidIncrement;
    strategy = 'conservative';
    confidence = 90;
    reasoning = 'Low competition detected. A minimal increment bid has high win probability.';
  } else if (timeLeftHours > 12) {
    // Lots of time left - don't overpay
    strategy = 'wait';
    confidence = 75;
    reasoning = 'Plenty of time remaining. Consider waiting for better timing before bidding.';
  } else {
    reasoning = 'Moderate activity. A reasonable increment should keep you competitive.';
  }

  // Factor in price history trend
  const priceTrend = bids.length >= 2 ?
    ((bids[0].amount - bids[Math.min(4, bids.length - 1)].amount) / bids[Math.min(4, bids.length - 1)].amount * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: {
      recommendedBid: Math.ceil(recommendedBid * 100) / 100,
      strategy,
      confidence,
      reasoning,
      marketInsights: {
        bidVelocity: bidVelocity.toFixed(2),
        priceTrend: `${priceTrend}%`,
        timeLeft: `${Math.floor(timeLeftHours)}h ${Math.floor((timeLeftHours % 1) * 60)}m`,
        competition: bids.length < 3 ? 'Low' : bids.length < 10 ? 'Medium' : 'High',
        userBidHistory: userBids.length,
      },
    },
  });
});

// @desc    End auction (admin/cron)
// @route   POST /api/auctions/:id/end
// @access  Admin
const endAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);
  if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
  if (!['active', 'scheduled'].includes(auction.status)) {
    return res.status(400).json({ success: false, message: 'Auction cannot be ended in its current state.' });
  }

  if (auction.currentBidder && auction.bidCount > 0) {
    await endAuctionWithWinner(auction, auction.currentBidder, auction.currentBid);
  } else {
    auction.status = 'ended';
    await auction.save();
  }

  await Seller.findByIdAndUpdate(auction.seller, { $inc: { activeAuctions: -1, completedAuctions: 1 } });
  res.json({ success: true, message: 'Auction ended.', data: auction });
});

module.exports = { getAuctions, getAuction, createAuction, updateAuction, deleteAuction, placeBid, getFeaturedAuctions, getAuctionBids, getBidRecommendation, endAuction };
