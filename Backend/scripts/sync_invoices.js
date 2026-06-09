const pool = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function syncInvoices() {
    console.log('Sincronizando boletas físicas con la base de datos...');
    
    const invoicesDir = path.join(__dirname, '../public/uploads/invoices');
    const files = fs.readdirSync(invoicesDir).filter(f => f.startsWith('boleta-') && f.endsWith('.pdf'));

    for (const fileName of files) {
        const parts = fileName.split('-');
        const orderId = parseInt(parts[1]);

        if (isNaN(orderId)) continue;

        try {
            // 1. Verificar si el pedido existe y obtener su total
            const [[order]] = await pool.query('SELECT totalPagar FROM pedido WHERE idPedido = ?', [orderId]);
            if (!order) {
                console.log(`Pedido #${orderId} no encontrado. Saltando archivo ${fileName}.`);
                continue;
            }

            // 2. Asegurar que existe un registro en la tabla PAGO
            let [pagos] = await pool.query('SELECT idPago FROM pago WHERE idPedido = ?', [orderId]);
            let idPago;

            if (pagos.length === 0) {
                console.log(`Creando registro de pago para pedido #${orderId}...`);
                const [pagoRes] = await pool.query(
                    'INSERT INTO pago (idPedido, idMetodoPago, monto, estado, referenciaExterna) VALUES (?, ?, ?, ?, ?)',
                    [orderId, 1, order.totalPagar, 'COMPLETADO', 'SYNC_LEGACY']
                );
                idPago = pagoRes.insertId;
            } else {
                idPago = pagos[0].idPago;
            }

            // 3. Insertar en comprobantepago si no existe
            const [[existingComp]] = await pool.query('SELECT idComprobante FROM comprobantepago WHERE idPago = ?', [idPago]);
            const rutaPDF = `/uploads/invoices/${fileName}`;

            if (!existingComp) {
                await pool.query(
                    'INSERT INTO comprobantepago (idPago, tipo, monto, rutaPDF) VALUES (?, ?, ?, ?)',
                    [idPago, 'Boleta', order.totalPagar, rutaPDF]
                );
                console.log(`Boleta vinculada: Pedido #${orderId} -> ${fileName}`);
            }

            // 4. Actualizar comprobantePago en tabla pedido por si acaso
            await pool.query('UPDATE pedido SET comprobantePago = ? WHERE idPedido = ?', [rutaPDF, orderId]);

        } catch (err) {
            console.error(`Error procesando #${orderId}:`, err.message);
        }
    }

    console.log('Sincronización completada.');
    process.exit();
}

syncInvoices();
