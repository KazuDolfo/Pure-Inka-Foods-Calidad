
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const { apiLimiter } = require('./middleware/rate-limit.middleware');


app.use(helmet({
  crossOriginResourcePolicy: false, 
}));
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);

// Endpoint de Salud del Sistema (RNF-08 / ISO 25010 Fiabilidad)
app.get('/api/health', async (req, res) => {
  const pool = require('./config/db');
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - start;
    
    res.json({
      success: true,
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: { status: 'CONNECTED', latency: `${dbLatency}ms` },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      database: { status: 'DISCONNECTED', error: error.message }
    });
  }
});


app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


require('./config/db');


app.get('/api/test', (req, res) => res.json({ message: '🚀 Servidor actualizado: ' + new Date().toISOString() }));
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/shipping', require('./routes/shipping.routes'));
app.use('/api/payment-methods', require('./routes/payment-method.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/coupons', require('./routes/coupon.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/tickets', require('./routes/ticket.routes'));



app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API de Pure Inka Foods funcionando perfectamente.',
    database: process.env.DB_NAME,
    version: '1.0.0'
  });
});


app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `❌ Ruta no encontrada: ${req.originalUrl}`
  });
});


app.use((err, req, res, next) => {
  logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);
  
  res.status(500).json({
    success: false,
    message: '💥 Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;
