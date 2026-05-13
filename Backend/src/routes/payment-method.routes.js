const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/payment-method.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento para QR
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/products/'); // Usamos la misma carpeta de productos por simplicidad o una nueva
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

router.get('/active', paymentMethodController.getActiveMethods);

router.get('/', authMiddleware, paymentMethodController.getAllMethods);
router.post('/', authMiddleware, upload.single('imagen_qr'), paymentMethodController.createMethod);
router.put('/:id', authMiddleware, upload.single('imagen_qr'), paymentMethodController.updateMethod);
router.delete('/:id', authMiddleware, paymentMethodController.deleteMethod);

module.exports = router;
