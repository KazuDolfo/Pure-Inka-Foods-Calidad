
const app = require('./src/app');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const PORT = process.env.PORT || 5000;

// Asegurar que existan las carpetas de carga
const uploadDirs = [
  'public/uploads/products',
  'public/uploads/invoices',
  'public/uploads/comprobantes'
];

uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Carpeta creada: ${dir}`);
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de Pure Inka Foods corriendo en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Base de datos: ${process.env.DB_NAME || 'pureinka'}`);
});

// Lógica de Apagado Seguro (ISO 25010 Fiabilidad)
const gracefulShutdown = async (signal) => {
  console.log(`\nSeñal ${signal} recibida. Cerrando servidor de forma segura...`);
  server.close(async () => {
    console.log('Servidor HTTP cerrado.');
    try {
      const pool = require('./src/config/db');
      await pool.end();
      console.log('Conexiones a la base de datos cerradas.');
      process.exit(0);
    } catch (err) {
      console.error('Error al cerrar la base de datos:', err);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));


process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo no manejado:', reason);
  console.error('Promesa:', promise);
  
  
});

process.on('uncaughtException', (err) => {
  console.error('Excepción no capturada:', err);
  console.error('Aplicación en estado inestable. Apagando...');
  process.exit(1);
});