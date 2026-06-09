const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

/**
 * Filtro para validar formatos de imagen y PDF (RNF-16)
 */
const voucherFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Solo se aceptan JPG, PNG y PDF.'));
  }
};

/**
 * Filtro para validar solo imágenes (para productos)
 */
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, PNG, WEBP).'));
  }
};

/**
 * Optimiza una imagen reduciendo su tamaño y calidad sin pérdida visual notable (RNF-02)
 */
const optimizeImage = async (filePath, width = 800) => {
  const tempPath = filePath + '_tmp';
  try {
    await sharp(filePath)
      .resize(width) // Redimensionar a un ancho estándar
      .jpeg({ quality: 80, mozjpeg: true }) // Comprimir JPEG
      .toFile(tempPath);
    
    fs.renameSync(tempPath, filePath); // Reemplazar original con optimizada
    return true;
  } catch (error) {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    console.error('Error al optimizar imagen:', error);
    return false;
  }
};

/**
 * Límites de tamaño (RNF-17)
 */
const limits = {
  voucher: { fileSize: 5 * 1024 * 1024 },
  product: { fileSize: 2 * 1024 * 1024 }
};

function createDiskStorage(destinationPath, filenamePrefix) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationPath),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${filenamePrefix}${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });
}

function buildUploadMiddleware({
  destinationPath,
  filenamePrefix,
  fieldName,
  fileFilter,
  fileLimits,
  sizeErrorMessage,
}) {
  const storage = createDiskStorage(destinationPath, filenamePrefix);
  const upload = multer({
    storage,
    fileFilter,
    limits: fileLimits,
  });

  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE' ? sizeErrorMessage : err.message;
        return res.status(400).json({ success: false, message });
      }
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      return next();
    });
  };
}

module.exports = {
  voucherFilter,
  imageFilter,
  optimizeImage,
  limits,
  buildUploadMiddleware,
};
