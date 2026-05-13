// routes/watchlist.js
const express = require('express');
const wlRouter = express.Router();
const { protect } = require('../middleware/auth');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/userController');
wlRouter.get('/', protect, getWatchlist);
wlRouter.post('/:auctionId', protect, addToWatchlist);
wlRouter.delete('/:auctionId', protect, removeFromWatchlist);
module.exports = wlRouter;
