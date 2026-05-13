const pool = require('../src/config/db');

async function fixTable() {
  try {
    console.log('🚀 Ajustando tabla MetodoPago...');
    
    const columns = [
        { name: 'activo', type: 'BOOLEAN DEFAULT TRUE' },
        { name: 'instrucciones', type: 'TEXT NULL' },
        { name: 'imagen_qr', type: 'VARCHAR(255) NULL' }
    ];

    for (const col of columns) {
        try {
            await pool.query(`ALTER TABLE MetodoPago ADD COLUMN ${col.name} ${col.type}`);
            console.log(`✅ Columna ${col.name} añadida.`);
        } catch (e) {
            console.log(`ℹ️ La columna ${col.name} ya existe.`);
        }
    }

    console.log('✨ Base de datos lista.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error crítico:', error);
    process.exit(1);
  }
}

fixTable();
