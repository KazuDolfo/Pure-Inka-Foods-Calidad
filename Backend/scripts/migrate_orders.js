const pool = require('../src/config/db');

async function migrate() {
  try {
    console.log('Añadiendo columnas a Pedido...');
    
    try {
      await pool.query('ALTER TABLE Pedido ADD COLUMN metodoPago VARCHAR(50) AFTER totalPagar');
      console.log('Columna metodoPago añadida.');
    } catch (e) { console.log('metodoPago ya existe o error'); }

    try {
      await pool.query('ALTER TABLE Pedido ADD COLUMN comprobantePago VARCHAR(255) AFTER metodoPago');
      console.log('Columna comprobantePago añadida.');
    } catch (e) { console.log('comprobantePago ya existe o error'); }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrate();
