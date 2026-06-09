const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);
router.use(authenticate.isAdmin);

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/messages', adminController.getMessages);
router.get('/distributor-requests', adminController.getDistributorRequests);
router.get('/coupons', adminController.getAllCoupons);
router.patch('/coupons/:id/status', adminController.toggleCouponStatus);

module.exports = router;
