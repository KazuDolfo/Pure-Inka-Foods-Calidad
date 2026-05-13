const pool = require('../src/config/db');

async function checkCols() {
  try {
    const [cols] = await pool.query('DESCRIBE DireccionCliente');
    console.log('DireccionCliente Columns:');
    console.table(cols.map(c => ({ Field: c.Field, Type: c.Type, Null: c.Null })));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCols();
