const pool = require('../src/config/db');

async function seedOrders() {
    try {
        console.log('Iniciando generación de pedidos de prueba...');
        
        // 1. Obtener clientes (que no sean admin)
        const [clients] = await pool.query("SELECT idCliente, nombre FROM cliente WHERE rol != 'admin' AND activo = 1");
        if (clients.length === 0) {
            console.log('ℹNo se encontraron clientes para generar pedidos.');
            return;
        }

        // 2. Obtener un producto base
        const [[product]] = await pool.query("SELECT idProducto, nombre, precio FROM producto WHERE activo = 1 LIMIT 1");
        if (!product) {
            console.log('No hay productos activos en la base de datos.');
            return;
        }

        const methods = ['yape', 'plin', 'transferencia'];
        
        for (const client of clients) {
            console.log(`\nProcesando cliente: ${client.nombre} (ID: ${client.idCliente})`);
            
            // Asegurar que tiene dirección
            let [addresses] = await pool.query('SELECT idDireccion FROM direccioncliente WHERE idCliente = ? LIMIT 1', [client.idCliente]);
            let dirId;
            
            if (addresses.length === 0) {
                const [res] = await pool.query(
                    'INSERT INTO direccioncliente (idCliente, direccion, distrito, ciudad, nombre_receptor, telefono_receptor) VALUES (?, ?, ?, ?, ?, ?)',
                    [client.idCliente, 'Calle de Prueba 123', 'Miraflores', 'Lima', client.nombre, '999888777']
                );
                dirId = res.insertId;
                console.log(`Dirección creada (ID: ${dirId})`);
            } else {
                dirId = addresses[0].idDireccion;
            }

            for (const method of methods) {
                const total = parseFloat(product.precio) + 10; // 10 de envío

                // Insertar Pedido
                const [orderRes] = await pool.query(
                    `INSERT INTO pedido (idCliente, idTipoEntrega, idDireccion, fecha, estado, totalProductos, costoEnvio, totalPagar, metodoPago, tipoComprobante) 
                     VALUES (?, 1, ?, NOW(), 'PENDIENTE', ?, 10, ?, ?, 'BOLETA')`,
                    [client.idCliente, dirId, product.precio, total, method]
                );
                const orderId = orderRes.insertId;

                // Insertar Detalle
                await pool.query(
                    'INSERT INTO detallepedido (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, 1, ?, ?)',
                    [orderId, product.idProducto, product.precio, product.precio]
                );

                // Insertar Pago (como pendiente)
                const [[metodoDb]] = await pool.query('SELECT idMetodoPago FROM metodopago WHERE nombre = ?', [method]);
                const idMetodo = metodoDb ? metodoDb.idMetodoPago : 1;

                await pool.query(
                    'INSERT INTO pago (idPedido, idMetodoPago, monto, estado, referenciaExterna) VALUES (?, ?, ?, "PENDIENTE", ?)',
                    [orderId, idMetodo, total, `SEED_AUTO_${method.toUpperCase()}`]
                );

                console.log(`Pedido #${orderId} generado con ${method}.`);
            }
        }

        console.log('\nTodos los pedidos han sido generados exitosamente.');
    } catch (error) {
        console.error('\nError durante el proceso:', error);
    } finally {
        process.exit();
    }
}

seedOrders();
