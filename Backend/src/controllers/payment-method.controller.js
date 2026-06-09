const pool = require('../config/db');
const { sendSuccess, handleError, buildUpdateQuery } = require('../utils/controller-helpers');

const PAYMENT_METHOD_SELECT_QUERY = 'SELECT *, idMetodoPago as id_metodo FROM MetodoPago';

function getQrImageFilename(req) {
  return req.file ? req.file.filename : null;
}

function mapMethodData(body, qrImage) {
  return {
    nombre: body.nombre,
    descripcion: body.descripcion,
    instrucciones: body.instrucciones,
    activo: body.activo ? 1 : 0,
    imagen_qr: qrImage,
  };
}

exports.getAllMethods = async (req, res) => {
  try {
    const [rows] = await pool.query(PAYMENT_METHOD_SELECT_QUERY);
    return sendSuccess(res, { data: rows });
  } catch (error) {
    return handleError(res, error, 'Error al obtener métodos', 'paymentMethod.getAllMethods');
  }
};

exports.getActiveMethods = async (req, res) => {
  try {
    const [rows] = await pool.query(`${PAYMENT_METHOD_SELECT_QUERY} WHERE activo = 1`);
    return sendSuccess(res, { data: rows });
  } catch (error) {
    return handleError(res, error, 'Error al obtener métodos activos', 'paymentMethod.getActiveMethods');
  }
};

exports.createMethod = async (req, res) => {
  try {
    const qrImage = getQrImageFilename(req);
    const methodData = mapMethodData(req.body, qrImage);

    const [result] = await pool.query(
      'INSERT INTO MetodoPago (nombre, descripcion, instrucciones, activo, imagen_qr) VALUES (?, ?, ?, ?, ?)',
      [methodData.nombre, methodData.descripcion, methodData.instrucciones, methodData.activo, methodData.imagen_qr]
    );

    return sendSuccess(res, { data: { id_metodo: result.insertId } }, 201);
  } catch (error) {
    return handleError(res, error, 'Error al crear método', 'paymentMethod.createMethod');
  }
};

exports.updateMethod = async (req, res) => {
  try {
    const methodId = req.params.id;
    const qrImage = getQrImageFilename(req);
    const methodData = mapMethodData(req.body, qrImage);

    const { query, params } = buildUpdateQuery(
      'UPDATE MetodoPago SET nombre = ?, descripcion = ?, instrucciones = ?, activo = ?',
      [methodData.nombre, methodData.descripcion, methodData.instrucciones, methodData.activo],
      [{ column: 'imagen_qr', value: methodData.imagen_qr }]
    );

    await pool.query(`${query} WHERE idMetodoPago = ?`, [...params, methodId]);
    return sendSuccess(res, { message: 'Método actualizado' });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar método', 'paymentMethod.updateMethod');
  }
};

exports.deleteMethod = async (req, res) => {
  try {
    const methodId = req.params.id;
    await pool.query('DELETE FROM MetodoPago WHERE idMetodoPago = ?', [methodId]);
    return sendSuccess(res, { message: 'Método eliminado' });
  } catch (error) {
    return handleError(res, error, 'Error al eliminar método', 'paymentMethod.deleteMethod');
  }
};
