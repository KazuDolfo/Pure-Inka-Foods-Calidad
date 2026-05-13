
const app = require('./src/app');

require('dotenv').config();

const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor de Pure Inka Foods corriendo en http://localhost:${PORT}`);
  console.log(`🔧 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Base de datos: ${process.env.DB_NAME || 'pureinka'}`);
});


process.on('SIGINT', () => {
  console.log('\n🛑 Apagado solicitado. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Señal SIGTERM recibida. Apagando...');
  server.close(() => {
    console.log('✅ Servidor cerrado por SIGTERM.');
    process.exit(0);
  });
});


process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rechazo no manejado:', reason);
  console.error('Promesa:', promise);
  
  
});

process.on('uncaughtException', (err) => {
  console.error('💥 Excepción no capturada:', err);
  console.error('Aplicación en estado inestable. Apagando...');
  process.exit(1);
});