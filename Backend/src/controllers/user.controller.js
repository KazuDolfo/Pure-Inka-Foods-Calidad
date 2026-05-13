
const pool = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener datos del cliente
    const [users] = await pool.query(
      'SELECT idCliente, nombre, correo, telefono, rol, fechaRegistro FROM Cliente WHERE idCliente = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    const user = users[0];

    // Obtener direcciones del usuario
    const [addresses] = await pool.query(
      'SELECT idDireccion, direccion, referencia, distrito, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, esPrincipal FROM DireccionCliente WHERE idCliente = ?',
      [userId]
    );

    user.direcciones = addresses;

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, telefono } = req.body;

    await pool.query(
      'UPDATE Cliente SET nombre = ?, telefono = ? WHERE idCliente = ?',
      [nombre, telefono, userId]
    );

    res.json({ success: true, message: 'Perfil actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    const [users] = await pool.query('SELECT contrasenaHash FROM Cliente WHERE idCliente = ?', [userId]);
    const user = users[0];

    const match = await bcrypt.compare(oldPassword, user.contrasenaHash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query('UPDATE Cliente SET contrasenaHash = ? WHERE idCliente = ?', [newHash, userId]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const [addresses] = await pool.query(
      'SELECT idDireccion, idDireccion as id_direccion, direccion, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, distrito, referencia FROM DireccionCliente WHERE idCliente = ?',
      [userId]
    );
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener direcciones.' });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      direccion, 
      ciudad, 
      pais, 
      codigo_postal, 
      tipo, 
      nombre_receptor, 
      telefono_receptor,
      distrito,
      referencia 
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO DireccionCliente (idCliente, direccion, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, distrito, referencia) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, direccion, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, distrito, referencia]
    );

    const newAddressId = result.insertId;
    const [newAddress] = await pool.query('SELECT *, idDireccion as id_direccion FROM DireccionCliente WHERE idDireccion = ?', [newAddressId]);

    res.status(201).json({ 
      success: true, 
      data: newAddress[0], 
      message: 'Dirección añadida exitosamente.' 
    });
  } catch (error) {
    console.error('Error al añadir dirección:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.updateAddress = async (req, res) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { 
        direccion, 
        ciudad, 
        pais, 
        codigo_postal, 
        tipo, 
        nombre_receptor, 
        telefono_receptor,
        distrito,
        referencia 
      } = req.body;
  
      await pool.query(
        `UPDATE DireccionCliente 
         SET direccion = ?, ciudad = ?, pais = ?, codigo_postal = ?, tipo = ?, nombre_receptor = ?, telefono_receptor = ?, distrito = ?, referencia = ? 
         WHERE idDireccion = ? AND idCliente = ?`,
        [direccion, ciudad, pais, codigo_postal, tipo, nombre_receptor, telefono_receptor, distrito, referencia, id, userId]
      );
  
      res.json({ success: true, message: 'Dirección actualizada correctamente.' });
    } catch (error) {
      console.error('Error al actualizar dirección:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
  };

exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await pool.query('DELETE FROM DireccionCliente WHERE idDireccion = ? AND idCliente = ?', [id, userId]);

    res.json({ success: true, message: 'Dirección eliminada.' });
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};
