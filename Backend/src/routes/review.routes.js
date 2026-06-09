const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/product/:idProducto', reviewController.getProductReviews);
router.post('/', authMiddleware, reviewController.createReview);

module.exports = router;
