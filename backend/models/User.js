const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [100, 'Name cannot exceed 100 characters'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] },
  password: { type: String, minlength: [8, 'Password must be at least 8 characters'], select: false },
  avatar: { type: String, default: '' },
  phone: { type: String, trim: true },
  address: {
    street: String, city: String, state: String, zipCode: String, country: { type: String, default: 'US' },
  },
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: String,
  googleId: { type: String },
  otp: { code: String, expiresAt: Date, attempts: { type: Number, default: 0 } },
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  preferences: {
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true } },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
  },
  bidCredits: { type: Number, default: 0 },
  totalBids: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  reputation: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  stripeCustomerId: String,
  paymentMethods: [{ stripePaymentMethodId: String, brand: String, last4: String, expMonth: Number, expYear: Number, isDefault: { type: Boolean, default: false } }],
  watchlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auction' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
// Index for performance
// Indexes - removed duplicates (email unique already set in schema)
userSchema.index({ googleId: 1 }, { sparse: true, unique: true });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save: hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Methods
userSchema.methods.comparePassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  return this.updateOne(updates);
};

userSchema.methods.generateOTP = function() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), attempts: 0 }; // 10 min
  return otp;
};

userSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
