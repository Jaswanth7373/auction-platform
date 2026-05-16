const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const Seller = require('../models/Seller');
const { sendTokenResponse, generateToken } = require('../utils/tokenUtils');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailUtils');
const { cacheSet, cacheGet, cacheDel } = require('../config/redis');
const logger = require('../utils/logger');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered.' });
  }

  const allowedRoles = ['user', 'seller'];
  const userRole = allowedRoles.includes(role) ? role : 'user';

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    role: userRole,
    isVerified: true,  // Auto-verify in development
    isActive: true,
    loginAttempts: 0,
  });
  // Generate and send OTP
  const otp = user.generateOTP();
  await user.save();

  await sendOTPEmail(email, name, otp, 'verification');
  logger.info(`New user registered: ${email} as ${userRole}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful! Please verify your email with the OTP sent.',
    userId: user._id,
    email: user.email,
  });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select('+otp +password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if (!user.otp?.code || !user.otp?.expiresAt) {
    return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
  }

  if (user.otp.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
  }

  if (user.otp.attempts >= 5) {
    return res.status(429).json({ success: false, message: 'Too many OTP attempts. Request a new OTP.' });
  }

  if (user.otp.code !== otp.toString()) {
    user.otp.attempts = (user.otp.attempts || 0) + 1;
    await user.save();
    return res.status(400).json({ success: false, message: 'Invalid OTP.' });
  }

  user.isVerified = true;
  user.otp = undefined;

  // If seller registration, create seller profile
  if (user.role === 'seller') {
    const existingSeller = await Seller.findOne({ user: user._id });
    if (!existingSeller) {
      await Seller.create({ user: user._id, businessName: user.name });
    }
  }

  await user.save();
  await sendWelcomeEmail(user.email, user.name);

  sendTokenResponse(user, 200, res, 'Email verified successfully! Welcome to AuctionPro.');
});

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.isVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });

  // Rate limit resend
  const lastSent = user.otp?.expiresAt;
  if (lastSent && (lastSent.getTime() - 10 * 60 * 1000) > Date.now() - 60 * 1000) {
    return res.status(429).json({ success: false, message: 'Please wait 1 minute before requesting a new OTP.' });
  }

  const otp = user.generateOTP();
  await user.save();
  await sendOTPEmail(user.email, user.name, otp, 'verification');

  res.json({ success: true, message: 'OTP resent successfully.' });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

  if (user.isLocked) {
    return res.status(423).json({ success: false, message: 'Account temporarily locked due to multiple failed attempts. Try again in 2 hours.' });
  }

  if (!user.password) {
    return res.status(401).json({ success: false, message: 'Account uses social login. Please use Google to sign in.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!user.isVerified) {
    const otp = user.generateOTP();
    await user.save();
    await sendOTPEmail(user.email, user.name, otp, 'verification');
    return res.status(403).json({
      success: false,
      message: 'Please verify your email. A new OTP has been sent.',
      userId: user._id,
      requiresVerification: true,
    });
  }

  if (user.isBanned) return res.status(403).json({ success: false, message: `Account banned: ${user.banReason}` });

  // Reset login attempts on success
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  logger.info(`User logged in: ${email}`);
  sendTokenResponse(user, 200, res, 'Login successful.');
});

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // Blacklist the token
  if (req.token) {
    const decoded = require('jsonwebtoken').decode(req.token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) await cacheSet(`blacklist:${req.token}`, true, ttl);
  }

  res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.cookie('refreshToken', '', { expires: new Date(0), httpOnly: true });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: user.toPublicJSON() });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });

  // Always return success (prevent email enumeration)
  if (!user) return res.json({ success: true, message: 'If an account exists with this email, you will receive a reset link.' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  await sendPasswordResetEmail(email, user.name, resetToken);
  res.json({ success: true, message: 'If an account exists with this email, you will receive a reset link.' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password are required.' });

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful.');
});

// @desc    Google OAuth callback handler
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);

  const token = generateToken(user._id, user.role);
  res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token.' });

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh token.' });

    const newToken = generateToken(user._id, user.role);
    res.json({ success: true, token: newToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
});

module.exports = { register, verifyOTP, resendOTP, login, logout, getMe, forgotPassword, resetPassword, googleCallback, refreshToken };
