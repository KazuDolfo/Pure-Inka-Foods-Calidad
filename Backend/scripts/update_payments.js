const pool = require('../src/config/db');

async function updatePaymentMethods() {
  try {
    console.log('🚀 Actualizando tabla MetodoPago...');
    
    
    try {
        await pool.query('ALTER TABLE MetodoPago ADD COLUMN activo BOOLEAN DEFAULT TRUE');
        console.log('✅ Columna "activo" añadida.');
    } catch (e) { console.log('ℹ️ La columna "activo" ya existe.'); }

    
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE MetodoPago');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const methods = [
      ['card', 'Tarjeta de Crédito/Débito', true],
      ['yape', 'Yape', true],
      ['plin', 'Plin', true],
      ['transferencia', 'Transferencia Bancaria', true]
    ];

    for (const [nombre, desc, activo] of methods) {
      await pool.query('INSERT INTO MetodoPago (nombre, descripcion, activo) VALUES (?, ?, ?)', [nombre, desc, activo]);
      console.log(`✅ Método configurado: ${nombre} (${activo ? 'Habilitado' : 'Inhabilitado'})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updatePaymentMethods();
