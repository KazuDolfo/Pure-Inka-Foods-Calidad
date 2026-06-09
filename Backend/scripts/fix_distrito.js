const pool = require('../src/config/db');

async function migrate() {
  try {
    console.log('Haciendo distrito nullable...');
    await pool.query('ALTER TABLE DireccionCliente MODIFY COLUMN distrito VARCHAR(100) NULL');
    console.log('Distrito ahora es nullable.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrate();
