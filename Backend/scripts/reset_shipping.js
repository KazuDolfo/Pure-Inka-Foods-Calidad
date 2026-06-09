const pool = require('../src/config/db');

async function resetShipping() {
  try {
    console.log('🚀 Reseteando métodos de envío...');
    
    
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE TipoEntrega');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const methods = [
      ['Normal', 10.00],
      ['Express', 25.00],
      ['Recojo en Tienda', 0.00]
    ];

    for (const [nombre, costo] of methods) {
      await pool.query('INSERT INTO TipoEntrega (nombre, costo) VALUES (?, ?)', [nombre, costo]);
      console.log(`Añadido: ${nombre}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetShipping();
