const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [200, 'Title cannot exceed 200 chars'] },
  description: { type: String, required: [true, 'Description is required'], maxlength: [5000, 'Description cannot exceed 5000 chars'] },
  category: {
    type: String,
    required: true,
    enum: ['electronics', 'fashion', 'art', 'collectibles', 'jewelry', 'vehicles', 'real-estate', 'sports', 'books', 'music', 'furniture', 'vintage', 'gaming', 'other'],
  },
  subcategory: String,
  images: [{ url: String, publicId: String, isPrimary: { type: Boolean, default: false } }],
  condition: { type: String, enum: ['new', 'like-new', 'excellent', 'good', 'fair', 'poor'], required: true },
  startingBid: { type: Number, required: [true, 'Starting bid is required'], min: [0.01, 'Starting bid must be positive'] },
  reservePrice: { type: Number, default: null }, // hidden reserve
  buyNowPrice: { type: Number, default: null },
  currentBid: { type: Number, default: 0 },
  currentBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bidCount: { type: Number, default: 0 },
  minimumBidIncrement: { type: Number, default: 1 },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'scheduled', 'active', 'ended', 'sold', 'cancelled', 'disputed'], default: 'draft' },
  isReservemet: { type: Boolean, default: false },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  winningBid: { type: Number, default: null },
  tags: [String],
  location: { city: String, state: String, country: String },
  shippingOptions: [{
    name: String, price: Number, estimatedDays: Number, carrier: String
  }],
  shippingIncluded: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  watchCount: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  autoExtend: { type: Boolean, default: true }, // extend if bid in last 5 min
  extensionMinutes: { type: Number, default: 5 },
  extensionCount: { type: Number, default: 0 },
  maxExtensions: { type: Number, default: 3 },
  specifications: [{ key: String, value: String }],
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  aiRecommendedPrice: Number,
  priceHistory: [{ price: Number, timestamp: Date, bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }],
  reportCount: { type: Number, default: 0 },
  reports: [{ reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, reason: String, reportedAt: Date }],
}, { timestamps: true });

// Indexes
auctionSchema.index({ status: 1 });
auctionSchema.index({ category: 1 });
auctionSchema.index({ seller: 1 });
auctionSchema.index({ endTime: 1 });
auctionSchema.index({ startTime: 1 });
auctionSchema.index({ currentBid: -1 });
auctionSchema.index({ createdAt: -1 });
auctionSchema.index({ title: 'text', description: 'text', tags: 'text' });
auctionSchema.index({ isFeatured: 1, status: 1 });

// Virtual: time remaining
auctionSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'active') return 0;
  return Math.max(0, this.endTime - Date.now());
});

// Virtual: isEnded
auctionSchema.virtual('isEnded').get(function() {
  return this.endTime < Date.now() || ['ended', 'sold', 'cancelled'].includes(this.status);
});

// Pre-save: set initial currentBid to startingBid
auctionSchema.pre('save', function(next) {
  if (this.isNew && this.currentBid === 0) {
    this.currentBid = this.startingBid;
  }
  next();
});

// Method: check if auction should auto-extend
auctionSchema.methods.shouldAutoExtend = function(bidTime) {
  if (!this.autoExtend) return false;
  if (this.extensionCount >= this.maxExtensions) return false;
  const timeUntilEnd = this.endTime - bidTime;
  return timeUntilEnd <= this.extensionMinutes * 60 * 1000;
};

auctionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Auction', auctionSchema);
