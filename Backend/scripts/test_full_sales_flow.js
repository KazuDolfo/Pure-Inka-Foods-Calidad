const pool = require('../src/config/db');
const { register } = require('../src/controllers/auth.controller');
const { createOrder } = require('../src/controllers/order.controller');
const { updateOrderStatus } = require('../src/controllers/admin.controller');
const path = require('path');

// Mock de res y req para simular controladores
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

async function testSystem() {
    console.log('Iniciando Prueba de Integración: Flujo de Venta Completo');
    console.log('---------------------------------------------------------');

    try {
        // 1. Limpieza previa (Opcional, pero para tests limpios)
        // Usaremos un usuario de prueba único
        const testEmail = `tester_${Date.now()}@inka.com`;
        
        // 2. Probar Tabla: Cliente (Registro)
        console.log('1. [TABLA: Cliente] Registrando nuevo usuario...');
        let capturedRegJson;
        const reqReg = {
            body: {
                nombre: 'Test User',
                correo: testEmail,
                telefono: '999888777',
                contrasena: 'password123'
            }
        };
        const resReg = { 
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { capturedRegJson = j; return this; }
        };
        await register(reqReg, resReg);
        const userId = capturedRegJson.userId;
        console.log(`Usuario creado con ID: ${userId}`);

        // 3. Probar Tabla: DireccionCliente
        console.log('2. [TABLA: DireccionCliente] Creando dirección de envío...');
        const [dirResult] = await pool.query(
            'INSERT INTO DireccionCliente (idCliente, direccion, distrito, ciudad, nombre_receptor, telefono_receptor) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, 'Av. Prueba 123', 'Miraflores', 'Lima', 'Receptor Test', '987654321']
        );
        const dirId = dirResult.insertId;
        console.log(`Dirección creada con ID: ${dirId}`);

        // 4. Verificar Tabla: Producto (Stock inicial)
        const [[product]] = await pool.query('SELECT idProducto, nombre, stock, precio FROM Producto LIMIT 1');
        console.log(`3. [TABLA: Producto] Usando producto: ${product.nombre} (Stock actual: ${product.stock})`);

        // 5. Probar Tablas: Pedido y DetallePedido
        console.log('4. [TABLAS: Pedido, DetallePedido] Creando pedido con Yape...');
        const orderItems = [{
            idProducto: product.idProducto,
            quantity: 1,
            price: product.precio
        }];
        
        let capturedOrderJson;
        const reqOrder = {
            user: { id: userId },
            body: {
                id_direccion_envio: dirId,
                id_tipo_entrega: 1,
                metodo_pago: 'yape',
                items: JSON.stringify(orderItems),
                subtotal: product.precio,
                costo_envio: 10,
                total: product.precio + 10
            },
            file: { filename: 'test-screenshot.png' }
        };
        
        const resOrder = { 
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { capturedOrderJson = j; return this; }
        };
        
        await createOrder(reqOrder, resOrder);
        const orderId = capturedOrderJson.data.id;
        console.log(`Pedido creado con ID: ${orderId} (Estado: PENDIENTE)`);

        // 6. Verificar Tabla: Producto (Stock final)
        const [[productAfter]] = await pool.query('SELECT stock FROM Producto WHERE idProducto = ?', [product.idProducto]);
        console.log(`5. [TABLA: Producto] Verificando reducción de stock: ${product.stock} -> ${productAfter.stock}`);

        // 7. Probar Tablas: Pago y ComprobantePago (Validación Admin)
        console.log('6. [TABLAS: Pago, ComprobantePago] Admin validando pago...');
        const reqAdmin = {
            params: { id: orderId },
            body: { estado: 'pagado' }
        };
        const resAdmin = { 
            status: function(s) { this.statusCode = s; return this; },
            json: function(j) { return this; }
        };
        
        await updateOrderStatus(reqAdmin, resAdmin);
        console.log(`Pedido #${orderId} validado por Admin.`);

        // 8. VERIFICACIÓN FINAL DE TODA LA BASE DE DATOS
        console.log('\n--- RESULTADOS FINALES DE BASE DE DATOS ---');
        
        const [[dbOrder]] = await pool.query('SELECT estado, comprobantePago FROM Pedido WHERE idPedido = ?', [orderId]);
        console.log(`Pedido #${orderId} - Estado: ${dbOrder.estado}`);
        console.log(`Pedido #${orderId} - Ruta Boleta: ${dbOrder.comprobantePago}`);

        const [[dbPago]] = await pool.query('SELECT idPago, monto, estado FROM Pago WHERE idPedido = ?', [orderId]);
        console.log(`Pago - ID: ${dbPago.idPago}, Monto: ${dbPago.monto}, Estado: ${dbPago.estado}`);

        const [[dbBoleta]] = await pool.query('SELECT rutaPDF FROM ComprobantePago WHERE idPago = ?', [dbPago.idPago]);
        console.log(`Boleta - Ruta PDF: ${dbBoleta.rutaPDF}`);

        if (dbOrder.estado === 'PAGADO' && dbBoleta.rutaPDF) {
            console.log('\nPRUEBA EXITOSA: Todas las tablas fueron afectadas correctamente.');
        } else {
            console.log('\nPRUEBA FALLIDA: Algunas tablas no se actualizaron.');
        }

    } catch (error) {
        console.error('\nERROR DURANTE LA PRUEBA:', error);
    } finally {
        process.exit();
    }
}

testSystem();
