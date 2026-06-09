const pool = require('../src/config/db');

async function checkComprobanteTable() {
    try {
        const [columns] = await pool.query('SHOW COLUMNS FROM comprobantepago');
        console.log('comprobantepago Columns:');
        console.table(columns);

        const [data] = await pool.query('SELECT * FROM comprobantepago');
        console.log('comprobantepago Data (First 5):');
        console.table(data.slice(0, 5));

        const [orders] = await pool.query('SELECT idPedido, estado, comprobantePago FROM pedido WHERE estado = "PAGADO" LIMIT 5');
        console.log('PAGADO Orders:');
        console.table(orders);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkComprobanteTable();
