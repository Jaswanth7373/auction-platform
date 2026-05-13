// routes/bids.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Bid } = require('../models');
router.get('/my', protect, async (req, res) => {
  const bids = await Bid.find({ bidder: req.user._id }).populate('auction', 'title images status endTime currentBid').sort('-createdAt').limit(50);
  res.json({ success: true, data: bids });
});
module.exports = router;
