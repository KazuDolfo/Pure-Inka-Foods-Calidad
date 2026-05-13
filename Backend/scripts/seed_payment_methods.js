const pool = require('../src/config/db');

async function seedPayment() {
  try {
    console.log('🚀 Sembrando métodos de pago...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE MetodoPago');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const methods = [
      ['card', 'Tarjeta de Crédito/Débito'],
      ['yape', 'Yape'],
      ['plin', 'Plin'],
      ['transferencia', 'Transferencia Bancaria']
    ];

    for (const [nombre, desc] of methods) {
      await pool.query('INSERT INTO MetodoPago (nombre, descripcion) VALUES (?, ?)', [nombre, desc]);
      console.log(`✅ Añadido: ${nombre}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedPayment();
