const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

console.log('--- USER ROUTES LOADING ---');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/change-password', authMiddleware, userController.changePassword);


router.get('/addresses', authMiddleware, userController.getAddresses);
router.post('/addresses', authMiddleware, userController.addAddress);
router.put('/addresses/:id', authMiddleware, userController.updateAddress);
router.delete('/addresses/:id', authMiddleware, userController.deleteAddress);

console.log('--- USER ROUTES REGISTERED ---');

module.exports = router;
