const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/payment-method.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { imageFilter, limits, buildUploadMiddleware } = require('../utils/file-upload');

const uploadQrImage = buildUploadMiddleware({
  destinationPath: 'public/uploads/products/',
  filenamePrefix: 'qr-',
  fieldName: 'imagen_qr',
  fileFilter: imageFilter,
  fileLimits: limits.product,
  sizeErrorMessage: 'La imagen del QR es demasiado grande. Máximo 2MB.',
});

router.get('/active', paymentMethodController.getActiveMethods);

router.use(authMiddleware);

router.get('/', paymentMethodController.getAllMethods);
router.post('/', uploadQrImage, paymentMethodController.createMethod);
router.put('/:id', uploadQrImage, paymentMethodController.updateMethod);
router.delete('/:id', paymentMethodController.deleteMethod);

module.exports = router;
