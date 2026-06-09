
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { voucherFilter, limits, buildUploadMiddleware } = require('../utils/file-upload');

const uploadVoucher = buildUploadMiddleware({
  destinationPath: 'public/uploads/comprobantes/',
  filenamePrefix: 'comprobante-',
  fieldName: 'comprobante_pago',
  fileFilter: voucherFilter,
  fileLimits: limits.voucher,
  sizeErrorMessage: 'El archivo es demasiado grande. Máximo 5MB.',
});

router.use(authMiddleware);

router.get('/my-orders', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetails);
router.patch('/:id/cancel', orderController.cancelOrder);
router.post('/', uploadVoucher, orderController.createOrder);

module.exports = router;
