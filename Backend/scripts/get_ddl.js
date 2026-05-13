const pool = require('../src/config/db');

async function getDDL() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('-- DDL generado desde la base de datos real\n');
    console.log(`CREATE DATABASE IF NOT EXISTS PureInkaFoodsDB;`);
    console.log(`USE PureInkaFoodsDB;\n`);

    for (const tableName of tableNames) {
      const [createResult] = await pool.query(`SHOW CREATE TABLE ${tableName}`);
      console.log(createResult[0]['Create Table'] + ';\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error al obtener el DDL:', error.message);
    process.exit(1);
  }
}

getDDL();
