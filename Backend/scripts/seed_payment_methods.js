const pool = require('../src/config/db');

const defaultMethods = [
    {
        nombre: 'card',
        descripcion: 'Tarjeta de Crédito/Débito',
        instrucciones: 'Pago seguro procesado por Stripe. Aceptamos Visa, MasterCard, y más.',
        activo: 1
    },
    {
        nombre: 'yape',
        descripcion: 'Yape',
        instrucciones: 'Escanea el código QR de Yape para realizar tu pago instantáneamente.',
        activo: 1
    },
    {
        nombre: 'plin',
        descripcion: 'Plin',
        instrucciones: 'Usa tu aplicación de Plin para escanear el QR y completar tu compra.',
        activo: 1
    },
    {
        nombre: 'transferencia',
        descripcion: 'Transferencia Bancaria',
        instrucciones: 'Realiza un depósito a nuestra cuenta BCP: 191-XXXXXXXX-X-XX. Envía el comprobante para validar.',
        activo: 1
    }
];

async function seed() {
    try {
        console.log('Iniciando seeding de métodos de pago...');
        
        for (const method of defaultMethods) {
            const [existing] = await pool.query('SELECT idMetodoPago FROM MetodoPago WHERE nombre = ?', [method.nombre]);
            
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO MetodoPago (nombre, descripcion, instrucciones, activo) VALUES (?, ?, ?, ?)',
                    [method.nombre, method.descripcion, method.instrucciones, method.activo]
                );
                console.log(`Método '${method.nombre}' creado.`);
            } else {
                console.log(`ℹMétodo '${method.nombre}' ya existe.`);
            }
        }
        
        console.log('Seeding completado con éxito.');
    } catch (error) {
        console.error('Error durante el seeding:', error);
    } finally {
        process.exit();
    }
}

seed();
