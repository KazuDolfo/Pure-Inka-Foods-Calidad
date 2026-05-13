const pool = require('../src/config/db');

async function checkCols() {
  try {
    const [cols] = await pool.query('DESCRIBE Pedido');
    console.log('Pedido Columns:');
    console.table(cols.map(c => ({ Field: c.Field, Type: c.Type })));
    
    const [detailsCols] = await pool.query('DESCRIBE DetallePedido');
    console.log('DetallePedido Columns:');
    console.table(detailsCols.map(c => ({ Field: c.Field, Type: c.Type })));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCols();
