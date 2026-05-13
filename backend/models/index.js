const mongoose = require('mongoose');

// =================== BID MODEL ===================
const bidSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: [0.01, 'Bid amount must be positive'] },
  isWinning: { type: Boolean, default: false },
  isAutoBid: { type: Boolean, default: false },
  maxAutoBid: Number, // user's max for auto-bidding
  status: { type: String, enum: ['active', 'outbid', 'won', 'cancelled'], default: 'active' },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true });

bidSchema.index({ auction: 1, amount: -1 });
bidSchema.index({ bidder: 1 });
bidSchema.index({ createdAt: -1 });

// =================== PAYMENT MODEL ===================
const paymentSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  amount: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  sellerAmount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'disputed'], default: 'pending' },
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeTransferId: String,
  paymentMethod: String,
  shippingAddress: { street: String, city: String, state: String, zipCode: String, country: String },
  shippingCost: { type: Number, default: 0 },
  shippingStatus: { type: String, enum: ['not_shipped', 'preparing', 'shipped', 'delivered'], default: 'not_shipped' },
  trackingNumber: String,
  carrier: String,
  notes: String,
  refundReason: String,
  refundedAt: Date,
  paidAt: Date,
  dueBy: Date,
}, { timestamps: true });

paymentSchema.index({ auction: 1 });
paymentSchema.index({ buyer: 1 });
paymentSchema.index({ seller: 1 });
paymentSchema.index({ status: 1 });

// =================== NOTIFICATION MODEL ===================
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['bid_placed', 'outbid', 'auction_won', 'auction_ended', 'auction_starting', 'payment_received', 'payment_due', 'seller_verified', 'new_follower', 'auction_watchlist', 'system', 'message', 'report_resolved'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // extra context data
  isRead: { type: Boolean, default: false },
  readAt: Date,
  link: String, // frontend route to navigate
  icon: String,
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// =================== REVIEW MODEL ===================
const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, maxlength: 200 },
  comment: { type: String, maxlength: 2000 },
  images: [String],
  sellerResponse: { message: String, respondedAt: Date },
  isVerifiedPurchase: { type: Boolean, default: true },
  helpfulVotes: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  isHidden: { type: Boolean, default: false },
}, { timestamps: true });

reviewSchema.index({ seller: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ auction: 1 });

// =================== WATCHLIST MODEL ===================
const watchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  notifyOnBid: { type: Boolean, default: true },
  notifyOnEndingSoon: { type: Boolean, default: true },
  addedAt: { type: Date, default: Date.now },
}, { timestamps: true });

watchlistSchema.index({ user: 1, auction: 1 }, { unique: true });
watchlistSchema.index({ user: 1, addedAt: -1 });

// =================== CHAT MESSAGE MODEL ===================
const chatMessageSchema = new mongoose.Schema({
  auction: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 2000 },
  isRead: { type: Boolean, default: false },
  readAt: Date,
  attachments: [{ url: String, type: String, name: String }],
  isSystemMessage: { type: Boolean, default: false },
}, { timestamps: true });

chatMessageSchema.index({ auction: 1, sender: 1, recipient: 1 });
chatMessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// =================== REPORT MODEL ===================
const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['auction', 'user', 'seller', 'review'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, enum: ['spam', 'fraud', 'inappropriate', 'counterfeit', 'other'], required: true },
  description: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['open', 'under_review', 'resolved', 'dismissed'], default: 'open' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  resolvedAt: Date,
}, { timestamps: true });

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });

module.exports = {
  Bid: mongoose.model('Bid', bidSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Review: mongoose.model('Review', reviewSchema),
  Watchlist: mongoose.model('Watchlist', watchlistSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema),
  Report: mongoose.model('Report', reportSchema),
};
