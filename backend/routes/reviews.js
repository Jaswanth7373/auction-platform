// routes/reviews.js
const express = require('express');
const reviewRouter = express.Router();
const { protect } = require('../middleware/auth');
const { createReview, getSellerReviews } = require('../controllers/userController');
reviewRouter.post('/', protect, createReview);
reviewRouter.get('/seller/:sellerId', getSellerReviews);
module.exports = reviewRouter;
