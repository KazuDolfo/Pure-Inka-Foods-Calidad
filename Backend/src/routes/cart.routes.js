const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authenticate = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/sync', cartController.syncCart);
router.delete('/', cartController.clearCart);

module.exports = router;