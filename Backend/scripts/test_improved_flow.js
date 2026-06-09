const pool = require('../src/config/db');
const { register } = require('../src/controllers/auth.controller');
const { createOrder } = require('../src/controllers/order.controller');
const { updateOrderStatus } = require('../src/controllers/admin.controller');

async function testImprovedFlow() {
    console.log('Probando Flujo Mejorado: Uso inmediato de tablas PAGO y COMPROBANTE');
    console.log('------------------------------------------------------------------');

    try {
        const testEmail = `flow_test_${Date.now()}@inka.com`;
        
        // 1. Registro de usuario
        console.log('1. Registrando usuario...');
        let capturedRegJson;
        const resReg = { 
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { capturedRegJson = j; return this; }
        };
        await register({ body: { nombre: 'Flow Tester', correo: testEmail, telefono: '900100200', contrasena: 'pass123' } }, resReg);
        const userId = capturedRegJson.userId;

        // 2. Crear pedido (Yape)
        console.log('2. Creando pedido (Yape)...');
        const [[product]] = await pool.query('SELECT idProducto, precio FROM Producto LIMIT 1');
        let capturedOrderJson;
        const resOrder = { 
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { capturedOrderJson = j; return this; }
        };
        await createOrder({
            user: { id: userId },
            body: {
                id_direccion_envio: 1, // Asumiendo que existe una dirección base
                id_tipo_entrega: 1,
                metodo_pago: 'yape',
                items: JSON.stringify([{ idProducto: product.idProducto, quantity: 1, price: product.precio }]),
                subtotal: product.precio,
                costo_envio: 0,
                total: product.precio
            },
            file: { filename: 'yape-screenshot.jpg' }
        }, resOrder);
        const orderId = capturedOrderJson.data.id;

        // 3. VERIFICACIÓN INMEDIATA EN TABLA PAGO
        console.log('🔍 VERIFICACIÓN: ¿Se creó el registro en PAGO inmediatamente?');
        const [[pagoPendiente]] = await pool.query('SELECT * FROM pago WHERE idPedido = ?', [orderId]);
        if (pagoPendiente) {
            console.log(`Registro encontrado en PAGO! ID: ${pagoPendiente.idPago}, Estado: ${pagoPendiente.estado}, Referencia: ${pagoPendiente.referenciaExterna}`);
        } else {
            throw new Error('❌ El registro en la tabla PAGO no se creó al iniciar el pedido.');
        }

        // 4. Validación Admin
        console.log('3. Administrador validando pago...');
        await updateOrderStatus({ params: { id: orderId }, body: { estado: 'pagado' } }, { status: () => ({ json: () => {} }), json: () => {} });

        // 5. VERIFICACIÓN FINAL EN AMBAS TABLAS
        console.log('🔍 VERIFICACIÓN FINAL:');
        const [[pagoFinal]] = await pool.query('SELECT estado FROM pago WHERE idPedido = ?', [orderId]);
        const [[comprobante]] = await pool.query('SELECT * FROM comprobantepago WHERE idPago = ?', [pagoPendiente.idPago]);

        console.log(`- Estado en PAGO: ${pagoFinal.estado}`);
        console.log(`- Registro en COMPROBANTEPAGO: ${comprobante ? 'EXISTE (OK)' : 'NO EXISTE'}`);
        if (comprobante) console.log(`- Ruta PDF: ${comprobante.rutaPDF}`);

        if (pagoFinal.estado === 'COMPLETADO' && comprobante) {
            console.log('\nÉXITO: Las tablas se usaron durante TODO el ciclo de vida.');
        }

    } catch (error) {
        console.error('\nERROR:', error.message);
    } finally {
        process.exit();
    }
}

testImprovedFlow();
