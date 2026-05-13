const mysql = require('mysql2/promise');
require('dotenv').config({path: '../.env'});

async function run() {
  try {
    const db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    const query = `
      INSERT INTO tipoentrega (idTipoEntrega, nombre, costo) 
      VALUES 
        (1, 'Envío Estándar', 10.00), 
        (2, 'Envío Express', 20.00), 
        (3, 'Recojo en Tienda', 0.00) 
      ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), costo=VALUES(costo)
    `;

    await db.execute(query);
    console.log('Tabla tipoentrega poblada exitosamente');
    await db.end();
  } catch (e) {
    console.error('Error al poblar la tabla:', e.message);
  }
}

run();
