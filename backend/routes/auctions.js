const express = require('express');
const router = express.Router();
const { protect, isSeller, isAdmin, optionalAuth } = require('../middleware/auth');
const { uploadAuctionImages } = require('../config/cloudinary');
const { getAuctions, getAuction, createAuction, updateAuction, deleteAuction, placeBid, getFeaturedAuctions, getAuctionBids, getBidRecommendation, endAuction } = require('../controllers/auctionController');
const { addToWatchlist, removeFromWatchlist } = require('../controllers/userController');

router.get('/', optionalAuth, getAuctions);
router.get('/featured', getFeaturedAuctions);
router.get('/:id', optionalAuth, getAuction);
router.post('/', protect, isSeller, uploadAuctionImages.array('images', 8), createAuction);
router.put('/:id', protect, isSeller, uploadAuctionImages.array('images', 8), updateAuction);
router.delete('/:id', protect, deleteAuction);
router.post('/:id/bid', protect, placeBid);
router.get('/:id/bids', getAuctionBids);
router.get('/:id/recommendation', protect, getBidRecommendation);
router.post('/:id/end', protect, isAdmin, endAuction);
router.post('/:auctionId/watchlist', protect, addToWatchlist);
router.delete('/:auctionId/watchlist', protect, removeFromWatchlist);

module.exports = router;
