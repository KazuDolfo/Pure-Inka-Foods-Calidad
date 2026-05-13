
const pool = require('./config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function syncDatabase() {
  try {
    console.log('⏳ Verificando y reparando estructura de la base de datos...');
    
    
    const [clienteCols] = await pool.query('SHOW COLUMNS FROM Cliente LIKE "rol"');
    if (clienteCols.length === 0) {
      console.log('🔧 Añadiendo columna "rol" a Cliente...');
      await pool.query('ALTER TABLE Cliente ADD COLUMN rol VARCHAR(20) DEFAULT "cliente" AFTER contrasenaHash');
    }
    await pool.query('ALTER TABLE Cliente MODIFY COLUMN contrasenaHash VARCHAR(255) NOT NULL');

    
    const [productoCols] = await pool.query('SHOW COLUMNS FROM Producto LIKE "imagen"');
    if (productoCols.length === 0) {
      console.log('🔧 Añadiendo columna "imagen" a Producto...');
      await pool.query('ALTER TABLE Producto ADD COLUMN imagen VARCHAR(255) AFTER stock');
    }

    
    const adminMail = 'admin@pureinka.com';
    const [existing] = await pool.query('SELECT idCliente FROM Cliente WHERE correo = ?', [adminMail]);
    
    if (existing.length === 0) {
      const hash = await bcrypt.hash('Admin123!', 12);
      await pool.query(
        'INSERT INTO Cliente (nombre, correo, telefono, contrasenaHash, rol) VALUES (?, ?, ?, ?, ?)',
        ['Admin', adminMail, '999', hash, 'admin']
      );
      console.log('✅ Usuario Administrador creado.');
    }

    console.log('🚀 Base de datos sincronizada correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en sincronización:', error.message);
    process.exit(1);
  }
}

syncDatabase();
