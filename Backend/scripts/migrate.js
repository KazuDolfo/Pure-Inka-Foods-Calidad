
const pool = require('../src/config/db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('Iniciando migración forzada...');

    try {
      console.log('Intentando añadir columna "imagen" a la tabla Producto...');
      await pool.query('ALTER TABLE Producto ADD COLUMN imagen VARCHAR(255) AFTER stock');
      console.log('Columna "imagen" añadida con éxito.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹLa columna "imagen" ya existe.');
      } else {
        throw err;
      }
    }

    console.log('🔧 Asegurando longitud de contrasenaHash...');
    await pool.query('ALTER TABLE Cliente MODIFY COLUMN contrasenaHash VARCHAR(255) NOT NULL');
    console.log('Tabla Cliente actualizada.');

    // 1. Crear tabla "cupon"
    try {
      console.log('Intentando crear tabla "cupon"...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cupon (
          idCupon INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(50) NOT NULL UNIQUE,
          tipo VARCHAR(20) NOT NULL,
          valor DECIMAL(10, 2) NOT NULL,
          fechaExpiracion DATETIME NOT NULL,
          activo TINYINT(1) DEFAULT 1,
          limiteUso INT DEFAULT 9999,
          vecesUsado INT DEFAULT 0
        )
      `);
      console.log('Tabla "cupon" asegurada.');
    } catch (err) {
      console.error('Error al crear tabla "cupon":', err.message);
    }

    // 2. Crear tabla "resena"
    try {
      console.log('Intentando crear tabla "resena"...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS resena (
          idResena INT AUTO_INCREMENT PRIMARY KEY,
          idProducto INT NOT NULL,
          idCliente INT NOT NULL,
          calificacion INT NOT NULL,
          comentario TEXT,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (idProducto) REFERENCES producto (idProducto) ON DELETE CASCADE,
          FOREIGN KEY (idCliente) REFERENCES cliente (idCliente) ON DELETE CASCADE,
          CONSTRAINT unique_producto_cliente UNIQUE (idProducto, idCliente)
        )
      `);
      console.log('Tabla "resena" asegurada.');
    } catch (err) {
      console.error('Error al crear tabla "resena":', err.message);
    }

    // 2.5 Crear tabla "cupon_cliente"
    try {
      console.log('Intentando crear tabla "cupon_cliente"...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cupon_cliente (
          idCupon INT NOT NULL,
          idCliente INT NOT NULL,
          fechaUso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (idCupon, idCliente),
          FOREIGN KEY (idCupon) REFERENCES cupon(idCupon) ON DELETE CASCADE,
          FOREIGN KEY (idCliente) REFERENCES cliente (idCliente) ON DELETE CASCADE
        )
      `);
      console.log('Tabla "cupon_cliente" asegurada.');
    } catch (err) {
      console.error('Error al crear tabla "cupon_cliente":', err.message);
    }

    // 3. Modificar tabla "pedido"
    try {
      console.log('Intentando añadir columnas de cupón a "pedido"...');
      await pool.query('ALTER TABLE pedido ADD COLUMN idCupon INT NULL AFTER comprobantePago');
      await pool.query('ALTER TABLE pedido ADD COLUMN descuento DECIMAL(10, 2) DEFAULT 0.00 AFTER idCupon');
      await pool.query('ALTER TABLE pedido ADD FOREIGN KEY (idCupon) REFERENCES cupon(idCupon)');
      console.log('Columnas de cupón añadidas a "pedido" con éxito.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹLas columnas de cupón ya existen en la tabla pedido.');
      } else {
        console.error('Error al modificar tabla "pedido":', err.message);
      }
    }

    // 4. Seed cupones
    try {
      console.log('Insertando cupones de prueba...');
      await pool.query(`
        INSERT IGNORE INTO cupon (codigo, tipo, valor, fechaExpiracion, activo, limiteUso) VALUES
        ('INKA10', 'porcentaje', 10.00, '2030-12-31 23:59:59', 1, 100),
        ('REGALO5', 'fijo', 5.00, '2030-12-31 23:59:59', 1, 100)
      `);
      console.log('Cupones de prueba insertados o ya existentes.');
    } catch (err) {
      console.error('Error al sembrar cupones:', err.message);
    }

    // 2.7 Crear tabla "ticket"
    try {
      console.log('Intentando crear tabla "ticket"...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ticket (
          idTicket INT AUTO_INCREMENT PRIMARY KEY,
          idCliente INT NOT NULL,
          asunto VARCHAR(255) NOT NULL,
          descripcion TEXT NOT NULL,
          categoria VARCHAR(100) NOT NULL,
          estado VARCHAR(50) DEFAULT 'ABIERTO',
          respuesta TEXT NULL,
          fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (idCliente) REFERENCES cliente(idCliente) ON DELETE CASCADE
        )
      `);
      console.log('Tabla "ticket" asegurada.');
    } catch (err) {
      console.error('Error al crear tabla "ticket":', err.message);
    }

    const [cols] = await pool.query('DESCRIBE Producto');
    console.log('\nEstructura actual de la tabla Producto:');
    console.table(cols.map(c => ({ Campo: c.Field, Tipo: c.Type })));

    console.log('\nMigración finalizada con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('ERROR CRÍTICO EN MIGRACIÓN:', error.message);
    process.exit(1);
  }
}

migrate();
