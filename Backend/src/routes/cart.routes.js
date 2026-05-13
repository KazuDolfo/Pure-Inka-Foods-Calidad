const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/sync', cartController.syncCart);
router.delete('/', cartController.clearCart);

module.exports = router;