const pool = require('../src/config/db');

async function checkMetodosPago() {
  try {
    const [cols] = await pool.query('DESCRIBE MetodoPago');
    console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));
    
    const [rows] = await pool.query('SELECT * FROM MetodoPago');
    console.log('Metodos en DB:', rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkMetodosPago();
