
const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping.controller');

router.get('/', shippingController.getAllShippingMethods);

module.exports = router;
