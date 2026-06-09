const pool = require('../config/db');
const { sendSuccess, handleError } = require('../utils/controller-helpers');

function formatShippingMethod(row) {
  return {
    ...row,
    costo: Number(row.costo),
    desc: row.nombre.toLowerCase().includes('tienda') ? 'Disponible en 24h' : 'Entrega a domicilio',
  };
}

exports.getAllShippingMethods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT idTipoEntrega as id, nombre, costo FROM tipoentrega');
    return sendSuccess(res, { data: rows.map(formatShippingMethod) });
  } catch (error) {
    return handleError(res, error, 'No se pudieron cargar los métodos de envío.', 'shipping.getAllShippingMethods');
  }
};
