const bcrypt = require('bcrypt');
const path = require('path');
const pool = require('../config/db');
const logger = require('./logger');
const { generateInvoice } = require('./pdf-generator');
const { optimizeImage } = require('./file-upload');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_STATUSES = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
const PAID_ORDER_STATUSES = ['PAGADO', 'ENVIADO', 'ENTREGADO'];
const CARD_PAYMENT_KEYWORDS = ['card', 'tarjeta'];
const PRODUCT_UPLOAD_DIR = path.join(__dirname, '../../public/uploads/products/');
const VOUCHER_UPLOAD_DIR = path.join(__dirname, '../../public/uploads/comprobantes/');

function getBcryptSaltRounds() {
  return parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
}

async function hashPassword(password) {
  return bcrypt.hash(password, getBcryptSaltRounds());
}

function sendSuccess(res, payload = {}, status = 200) {
  const body = { success: true, ...payload };
  return res.status(status).json(body);
}

function sendError(res, status, message, extra = {}) {
  return res.status(status).json({ success: false, message, ...extra });
}

function handleError(res, error, message, context) {
  logger.error(context, { error: error.message, stack: error.stack });
  return sendError(res, 500, message);
}

function mapChartSeries(rows) {
  return {
    labels: rows.map((r) => r.label),
    data: rows.map((r) => r.data),
  };
}

function isValidEmail(correo) {
  return EMAIL_REGEX.test(correo);
}

function isValidOrderStatus(estado) {
  return estado && ORDER_STATUSES.includes(String(estado).toLowerCase());
}

function normalizeOrderStatus(estado) {
  return String(estado).toUpperCase();
}

function isCardPayment(metodoPago) {
  const normalized = String(metodoPago || '').toLowerCase();
  return CARD_PAYMENT_KEYWORDS.includes(normalized);
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getProductIdFromCartItem(item) {
  return (
    item.idProducto ||
    item.id ||
    item.id_producto ||
    (item.product ? item.product.idProducto || item.product.id : null)
  );
}

function parseCartItems(items) {
  if (!items) return null;
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;
  return Array.isArray(parsed) ? parsed : null;
}

function getProductImageUrl(imagen) {
  if (!imagen) return 'assets/pure-inka-logo.png';
  if (imagen.startsWith('http')) return imagen;
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/products/${imagen}`;
}

function mapProductForApi(product) {
  return {
    ...product,
    id: product.idProducto,
    idProducto: product.idProducto,
    name: product.nombre,
    nombre: product.nombre,
    description: product.descripcion,
    descripcion: product.descripcion,
    price: Number(product.precio),
    precio: Number(product.precio),
    stock: product.stock,
    id_categoria: product.idCategoria,
    idCategoria: product.idCategoria,
    image: getProductImageUrl(product.imagen),
    promedioResenas: product.promedioResenas ? Number(Number(product.promedioResenas).toFixed(1)) : 0,
    totalResenas: product.totalResenas ? Number(product.totalResenas) : 0,
  };
}

async function optimizeUploadedImage(file, directory, maxWidth) {
  if (!file) return;
  const fullPath = path.join(directory, file.filename);
  await optimizeImage(fullPath, maxWidth);
}

async function ensureUserCart(db, userId) {
  let [[cart]] = await db.query('SELECT idCarrito FROM carrito WHERE idCliente = ?', [userId]);
  if (!cart) {
    const [result] = await db.query('INSERT INTO carrito (idCliente) VALUES (?)', [userId]);
    cart = { idCarrito: result.insertId };
  }
  return cart;
}

async function generateOrderInvoice(orderId, options = {}) {
  const { markPaymentComplete = false, referenciaExterna = 'ADMIN_MANUAL' } = options;

  try {
    const [[order]] = await pool.query('SELECT * FROM pedido WHERE idPedido = ?', [orderId]);
    if (!order) return null;

    const [details] = await pool.query(
      `SELECT dp.*, p.nombre as producto_nombre
       FROM detallepedido dp
       JOIN producto p ON dp.idProducto = p.idProducto
       WHERE dp.idPedido = ?`,
      [orderId]
    );

    const [[customer]] = await pool.query(
      'SELECT nombre, correo, telefono FROM cliente WHERE idCliente = ?',
      [order.idCliente]
    );

    const { fileName } = await generateInvoice(order, details, customer);
    const rutaBoleta = `/uploads/invoices/${fileName}`;

    await pool.query('UPDATE pedido SET comprobantePago = ? WHERE idPedido = ?', [rutaBoleta, orderId]);

    const [pagos] = await pool.query('SELECT idPago FROM pago WHERE idPedido = ?', [orderId]);
    let idPago;

    if (pagos.length > 0) {
      idPago = pagos[0].idPago;
      if (markPaymentComplete) {
        await pool.query('UPDATE pago SET estado = "COMPLETADO" WHERE idPago = ?', [idPago]);
      }
    } else {
      const [pagoRes] = await pool.query(
        'INSERT INTO pago (idPedido, idMetodoPago, monto, estado, referenciaExterna) VALUES (?, ?, ?, ?, ?)',
        [orderId, 1, order.totalPagar, 'COMPLETADO', referenciaExterna]
      );
      idPago = pagoRes.insertId;
    }

    await pool.query(
      `INSERT INTO comprobantepago (idPago, tipo, monto, rutaPDF)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rutaPDF = ?`,
      [idPago, order.tipoComprobante || 'Boleta', order.totalPagar, rutaBoleta, rutaBoleta]
    );

    logger.info(`Boleta generada para pedido #${orderId}: ${fileName}`);
    return { fileName, rutaBoleta };
  } catch (error) {
    logger.error('Error generando PDF de boleta', { orderId, error: error.message });
    return null;
  }
}

function buildUpdateQuery(baseSetClause, baseParams, optionalFields) {
  let query = baseSetClause;
  const params = [...baseParams];

  for (const { column, value } of optionalFields) {
    if (value != null) {
      query += `, ${column} = ?`;
      params.push(value);
    }
  }

  return { query, params };
}

module.exports = {
  EMAIL_REGEX,
  ORDER_STATUSES,
  PAID_ORDER_STATUSES,
  PRODUCT_UPLOAD_DIR,
  VOUCHER_UPLOAD_DIR,
  getBcryptSaltRounds,
  hashPassword,
  sendSuccess,
  sendError,
  handleError,
  mapChartSeries,
  isValidEmail,
  isValidOrderStatus,
  normalizeOrderStatus,
  isCardPayment,
  generateVerificationCode,
  getProductIdFromCartItem,
  parseCartItems,
  mapProductForApi,
  optimizeUploadedImage,
  ensureUserCart,
  generateOrderInvoice,
  buildUpdateQuery,
};
