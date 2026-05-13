
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nombre, correo, telefono, contrasena, rol = 'cliente' } = req.body;

    
    const [existing] = await pool.query('SELECT idCliente FROM Cliente WHERE correo = ?', [correo]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado.' });
    }

    
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const contrasenaHash = await bcrypt.hash(contrasena, saltRounds);

    
    const [result] = await pool.query(
      'INSERT INTO Cliente (nombre, correo, telefono, contrasenaHash, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, correo, telefono, contrasenaHash, rol]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente.',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const cleanCorreo = correo ? correo.trim().toLowerCase() : '';
    console.log(`🔍 Intento de login para: "${cleanCorreo}"`);

    
    const [users] = await pool.query('SELECT * FROM Cliente WHERE correo = ?', [cleanCorreo]);
    if (users.length === 0) {
      console.log('❌ Usuario no encontrado en la base de datos');
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    const user = users[0];
    console.log(`👤 Usuario encontrado: ${user.correo}. Rol: ${user.rol}`);
    console.log(`🔑 Hash en BD: ${user.contrasenaHash.substring(0, 15)}...`);

    
    const match = await bcrypt.compare(contrasena, user.contrasenaHash);
    if (!match) {
      console.log(`❌ La contraseña ingresada no coincide con el hash. Password length: ${contrasena.length}`);
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }

    console.log('✅ Login exitoso');

    
    const token = jwt.sign(
      { id: user.idCliente, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    
    delete user.contrasenaHash;
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          idCliente: user.idCliente,
          nombre: user.nombre,
          correo: user.correo,
          rol: user.rol,
          telefono: user.telefono
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { telefono } = req.body;
    if (!telefono) {
      return res.status(400).json({ success: false, message: 'El teléfono es requerido.' });
    }

    const [users] = await pool.query('SELECT idCliente, nombre FROM Cliente WHERE telefono = ?', [telefono]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Este Numero no esta Vinculada a una cuenta Cliente en LA Tienda' });
    }

    const user = users[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiration = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'UPDATE Cliente SET codigoRecuperacion = ?, expiracionCodigo = ? WHERE idCliente = ?',
      [code, expiration, user.idCliente]
    );

    console.log('------------------------------------------------');
    console.log(`📱 SMS PARA: ${telefono}`);
    console.log(`💬 Hola ${user.nombre}, tu código de recuperación de Pure Inka es: ${code}`);
    console.log('------------------------------------------------');

    res.json({ 
      success: true, 
      message: 'Se ha enviado un código de recuperación a tu teléfono.' 
    });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { telefono, codigo, nuevaContrasena } = req.body;

    if (!telefono || !codigo || !nuevaContrasena) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos.' });
    }

    
    const [users] = await pool.query(
      'SELECT idCliente FROM Cliente WHERE telefono = ? AND codigoRecuperacion = ? AND expiracionCodigo > NOW()',
      [telefono, codigo]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado.' });
    }

    const userId = users[0].idCliente;

    
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const contrasenaHash = await bcrypt.hash(nuevaContrasena, saltRounds);

    
    await pool.query(
      'UPDATE Cliente SET contrasenaHash = ?, codigoRecuperacion = NULL, expiracionCodigo = NULL WHERE idCliente = ?',
      [contrasenaHash, userId]
    );

    res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña.' });
  }
};
