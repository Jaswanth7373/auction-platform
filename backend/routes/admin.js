const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const { getAdminDashboard, manageUsers, banUser, verifySeller, manageAuctions } = require('../controllers/userController');

router.use(protect, isAdmin);
router.get('/dashboard', getAdminDashboard);
router.get('/users', manageUsers);
router.put('/users/:userId/ban', banUser);
router.put('/sellers/:sellerId/verify', verifySeller);
router.get('/auctions', manageAuctions);

module.exports = router;
