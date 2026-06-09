
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '123456',
  database: process.env.DB_NAME || 'PureInkaFoodsDB',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};


if (dbConfig.database !== 'PureInkaFoodsDB') {
  console.error('Error: El backend solo está configurado para ejecutarse con la base de datos "PureInkaFoodsDB".');
  process.exit(1);
}

const pool = mysql.createPool(dbConfig);


async function checkDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    
    const [dbResult] = await connection.query('SELECT DATABASE() as db');
    const currentDb = dbResult[0].db;
    
    if (!currentDb || currentDb.toLowerCase() !== 'PureInkaFoodsDB'.toLowerCase()) {
        throw new Error(`Base de datos incorrecta: ${currentDb || 'ninguna'}`);
    }

    
    const [tables] = await connection.query('SHOW TABLES LIKE "Cliente"');
    if (tables.length === 0) {
      console.warn('Advertencia: La tabla "Cliente" no existe. Asegúrate de ejecutar el script SQL.');
    }

    connection.release();
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
}

checkDatabase();

module.exports = pool;
