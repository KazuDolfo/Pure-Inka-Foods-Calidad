
const pool = require('../src/config/db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('🚀 Iniciando migración forzada...');

    
    try {
      console.log('🔧 Intentando añadir columna "imagen" a la tabla Producto...');
      await pool.query('ALTER TABLE Producto ADD COLUMN imagen VARCHAR(255) AFTER stock');
      console.log('✅ Columna "imagen" añadida con éxito.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ La columna "imagen" ya existe.');
      } else {
        throw err;
      }
    }

    
    console.log('🔧 Asegurando longitud de contrasenaHash...');
    await pool.query('ALTER TABLE Cliente MODIFY COLUMN contrasenaHash VARCHAR(255) NOT NULL');
    console.log('✅ Tabla Cliente actualizada.');

    
    const [cols] = await pool.query('DESCRIBE Producto');
    console.log('\n📊 Estructura actual de la tabla Producto:');
    console.table(cols.map(c => ({ Campo: c.Field, Tipo: c.Type })));

    console.log('\n✨ Migración finalizada. Ya puedes crear productos con imagen.');
    process.exit(0);
  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN MIGRACIÓN:', error.message);
    process.exit(1);
  }
}

migrate();
