
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rate-limit.middleware');


router.post('/register', authController.register);
router.post('/verify', authController.verifyAccount);
router.post('/login', loginLimiter, authController.login);
router.post('/google-login', authController.googleLogin);


router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
