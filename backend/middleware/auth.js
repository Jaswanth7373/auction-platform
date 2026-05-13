const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { cacheGet, cacheSet } = require('../config/redis');

// Protect routes - verify JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token blacklist (logout)
    const isBlacklisted = await cacheGet(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: 'Token has been invalidated. Please log in again.' });
    }

    // Cache user lookup
    let user = await cacheGet(`user:${decoded.id}`);
    if (!user) {
      user = await User.findById(decoded.id).select('-password -otp');
      if (user) await cacheSet(`user:${decoded.id}`, user.toJSON(), 300); // 5 min cache
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated.' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: `Account banned. Reason: ${user.banReason || 'Violation of terms'}` });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
});

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// Optional auth (doesn't fail if no token)
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp');
    if (user && user.isActive && !user.isBanned) req.user = user;
  } catch {
    // Ignore errors in optional auth
  }
  next();
});

// Verify seller
const isSeller = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Seller access required.' });
  }
  next();
});

// Admin only
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required.' });
  }
  next();
};

module.exports = { protect, authorize, optionalAuth, isSeller, isAdmin };
