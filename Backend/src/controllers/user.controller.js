const pool = require('../config/db');
const bcrypt = require('bcrypt');
const {
  sendSuccess,
  sendError,
  handleError,
  hashPassword,
} = require('../utils/controller-helpers');

const PROFILE_FIELDS = 'idCliente, nombre, correo, telefono, rol, fechaRegistro';
const ADDRESS_FIELDS = 'idDireccion, direccion, referencia, distrito, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, esPrincipal';
const ADDRESS_FIELDS_ALIAS = 'idDireccion, idDireccion as id_direccion, direccion, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, distrito, referencia';

function buildAddressParams(body) {
  return [
    body.direccion,
    body.ciudad,
    body.pais,
    body.codigo_postal,
    body.tipo,
    body.nombre_receptor,
    body.telefono_receptor,
    body.distrito,
    body.referencia,
  ];
}

async function fetchUserById(userId) {
  const [users] = await pool.query(`SELECT ${PROFILE_FIELDS} FROM Cliente WHERE idCliente = ?`, [userId]);
  return users[0];
}

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await fetchUserById(userId);

    if (!user) {
      return sendError(res, 404, 'Usuario no encontrado.');
    }

    const [addresses] = await pool.query(`SELECT ${ADDRESS_FIELDS} FROM DireccionCliente WHERE idCliente = ?`, [userId]);
    user.direcciones = addresses;

    return sendSuccess(res, { data: user });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'user.getProfile');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;

    await pool.query('UPDATE Cliente SET nombre = ?, telefono = ? WHERE idCliente = ?', [nombre, telefono, req.user.id]);
    return sendSuccess(res, { message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'user.updateProfile');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const [users] = await pool.query('SELECT contrasenaHash FROM Cliente WHERE idCliente = ?', [req.user.id]);
    const user = users[0];

    if (!user || !(await bcrypt.compare(oldPassword, user.contrasenaHash))) {
      return sendError(res, 400, 'La contraseña actual es incorrecta.');
    }

    const newHash = await hashPassword(newPassword);
    await pool.query('UPDATE Cliente SET contrasenaHash = ? WHERE idCliente = ?', [newHash, req.user.id]);

    return sendSuccess(res, { message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'user.changePassword');
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const [addresses] = await pool.query(`SELECT ${ADDRESS_FIELDS_ALIAS} FROM DireccionCliente WHERE idCliente = ?`, [req.user.id]);
    return sendSuccess(res, { data: addresses });
  } catch (error) {
    return handleError(res, error, 'Error al obtener direcciones.', 'user.getAddresses');
  }
};

exports.addAddress = async (req, res) => {
  try {
    const params = [req.user.id, ...buildAddressParams(req.body)];

    const [result] = await pool.query(
      `INSERT INTO DireccionCliente (idCliente, direccion, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, distrito, referencia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    const [newAddress] = await pool.query(`SELECT *, idDireccion as id_direccion FROM DireccionCliente WHERE idDireccion = ?`, [result.insertId]);

    return sendSuccess(res, {
      data: newAddress[0],
      message: 'Dirección añadida exitosamente.',
    }, 201);
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'user.addAddress');
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const params = [...buildAddressParams(req.body), addressId, req.user.id];

    await pool.query(
      `UPDATE DireccionCliente
       SET direccion = ?, ciudad = ?, pais = ?, codigo_postal = ?, tipo = ?, nombre_receptor = ?, telefono_receptor = ?, distrito = ?, referencia = ?
       WHERE idDireccion = ? AND idCliente = ?`,
      params
    );

    return sendSuccess(res, { message: 'Dirección actualizada correctamente.' });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'user.updateAddress');
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    await pool.query('DELETE FROM DireccionCliente WHERE idDireccion = ? AND idCliente = ?', [addressId, req.user.id]);
    return sendSuccess(res, { message: 'Dirección eliminada.' });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'user.deleteAddress');
  }
};
