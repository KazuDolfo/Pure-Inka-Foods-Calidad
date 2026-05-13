const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');


router.use(authMiddleware); 
router.use(authMiddleware.isAdmin); 

router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/orders', adminController.getAllOrders);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.get('/messages', adminController.getMessages);
router.get('/distributor-requests', adminController.getDistributorRequests);

module.exports = router;
