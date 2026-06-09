const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.post('/validate', authMiddleware, couponController.validateCoupon);
router.post('/', authMiddleware, couponController.createCoupon);

module.exports = router;
