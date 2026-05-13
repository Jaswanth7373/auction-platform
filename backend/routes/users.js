// routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadProfileImage } = require('../config/cloudinary');
const { getUserProfile, updateUserProfile, changePassword, getUserBids, getUserWins, getWatchlist } = require('../controllers/userController');

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, uploadProfileImage.single('avatar'), updateUserProfile);
router.put('/change-password', protect, changePassword);
router.get('/bids', protect, getUserBids);
router.get('/wins', protect, getUserWins);
router.get('/watchlist', protect, getWatchlist);

module.exports = router;
