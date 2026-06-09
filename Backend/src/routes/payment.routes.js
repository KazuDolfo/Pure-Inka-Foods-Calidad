const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);
router.post('/create-payment-intent', paymentController.createPaymentIntent);

module.exports = router;
