
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { imageFilter, limits, buildUploadMiddleware } = require('../utils/file-upload');

const uploadProductImage = buildUploadMiddleware({
  destinationPath: 'public/uploads/products/',
  filenamePrefix: 'product-',
  fieldName: 'imagen',
  fileFilter: imageFilter,
  fileLimits: limits.product,
  sizeErrorMessage: 'La imagen es demasiado grande. Máximo 2MB.',
});

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);
router.post('/', uploadProductImage, productController.createProduct);
router.put('/:id', uploadProductImage, productController.updateProduct);
router.put('/:id/stock', productController.updateStock);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
