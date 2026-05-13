
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();


app.use(helmet({
  crossOriginResourcePolicy: false, 
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '💥 Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;
