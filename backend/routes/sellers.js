const express = require('express');
const router = express.Router();
const { protect, isSeller } = require('../middleware/auth');
const { uploadProfileImage, uploadAuctionImages } = require('../config/cloudinary');
const { getSellerProfile, updateSellerProfile, getSellerDashboard, getSellerAuctions, submitVerification, getSellerReviews } = require('../controllers/userController');

router.get('/:id', getSellerProfile);
router.put('/profile', protect, isSeller, uploadProfileImage.single('logo'), updateSellerProfile);
router.get('/dashboard/stats', protect, isSeller, getSellerDashboard);
router.get('/my/auctions', protect, isSeller, getSellerAuctions);
router.post('/verification', protect, isSeller, uploadAuctionImages.array('documents', 5), submitVerification);
router.get('/:sellerId/reviews', getSellerReviews);

module.exports = router;
