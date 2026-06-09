const pool = require('../src/config/db');

async function migrate() {
  try {
    console.log('Actualizando tabla DireccionCliente...');
    
    const columnsToAdd = [
      { name: 'nombre_receptor', type: 'VARCHAR(150)' },
      { name: 'telefono_receptor', type: 'VARCHAR(20)' },
      { name: 'ciudad', type: 'VARCHAR(100)' },
      { name: 'pais', type: 'VARCHAR(100) DEFAULT "Perú"' },
      { name: 'codigo_postal', type: 'VARCHAR(20)' },
      { name: 'tipo', type: 'VARCHAR(20) DEFAULT "envio"' }
    ];

    for (const col of columnsToAdd) {
      try {
        await pool.query(`ALTER TABLE DireccionCliente ADD COLUMN ${col.name} ${col.type}`);
        console.log(`Columna ${col.name} añadida.`);
      } catch (e) {
        console.log(`ℹLa columna ${col.name} ya existe o error.`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrate();
