const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  sendSuccess,
  sendError,
  handleError,
  isValidEmail,
  hashPassword,
  generateVerificationCode,
} = require('../utils/controller-helpers');

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

function normalizeEmail(correo) {
  return String(correo || '').trim().toLowerCase();
}

function validateRegistrationFields({ nombre, correo, telefono, contrasena }) {
  return nombre && correo && telefono && contrasena;
}

function buildUserDto(user) {
  return {
    idCliente: user.idCliente,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
    telefono: user.telefono,
  };
}

function buildLockoutMessage(minutes) {
  return `Demasiados intentos fallidos. Su cuenta ha sido bloqueada por ${minutes} minutos.`;
}

function buildCredentialsError() {
  return 'Credenciales inválidas.';
}

async function findUserByEmail(correo) {
  const [users] = await pool.query('SELECT * FROM Cliente WHERE correo = ?', [correo]);
  return users[0];
}

async function findUserByPhone(telefono) {
  const [users] = await pool.query('SELECT idCliente, nombre FROM Cliente WHERE telefono = ?', [telefono]);
  return users[0];
}

async function registerUser(userData) {
  const { nombre, correo, telefono, contrasenaHash, rol, verificationCode } = userData;
  const [result] = await pool.query(
    'INSERT INTO Cliente (nombre, correo, telefono, contrasenaHash, rol, activo, codigoVerificacion) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [nombre, correo, telefono, contrasenaHash, rol, verificationCode]
  );
  return result.insertId;
}

async function updateFailedAttempts(userId, failedAttempts, blockedUntil = null) {
  await pool.query(
    'UPDATE Cliente SET intentosFallidos = ?, bloqueadoHasta = ? WHERE idCliente = ?',
    [failedAttempts, blockedUntil, userId]
  );
}

async function resetFailedAttempts(userId) {
  await pool.query('UPDATE Cliente SET intentosFallidos = 0, bloqueadoHasta = NULL WHERE idCliente = ?', [userId]);
}

function getJwtToken(user) {
  return jwt.sign({ id: user.idCliente, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });
}

function isAccountLocked(user) {
  return user.bloqueadoHasta && new Date(user.bloqueadoHasta) > new Date();
}

function debugVerificationCode(correo, verificationCode) {
  console.log('------------------------------------------------');
  console.log(`CÓDIGO DE VERIFICACIÓN PARA: ${correo}`);
  console.log(`Código: ${verificationCode}`);
  console.log('------------------------------------------------');
}

exports.register = async (req, res) => {
  try {
    const { nombre, correo, telefono, contrasena, rol = 'cliente' } = req.body;

    if (!validateRegistrationFields({ nombre, correo, telefono, contrasena })) {
      return sendError(res, 400, 'Todos los campos son requeridos.');
    }

    if (!isValidEmail(correo)) {
      return sendError(res, 400, 'Por favor, ingrese un correo electrónico válido.');
    }

    if (contrasena.length < 6) {
      return sendError(res, 400, 'La contraseña debe tener al menos 6 caracteres.');
    }

    const normalizedEmail = normalizeEmail(correo);
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return sendError(res, 400, 'El correo ya está registrado.');
    }

    const contrasenaHash = await hashPassword(contrasena);
    const verificationCode = generateVerificationCode();
    const userId = await registerUser({
      nombre,
      correo: normalizedEmail,
      telefono,
      contrasenaHash,
      rol,
      verificationCode,
    });

    debugVerificationCode(normalizedEmail, verificationCode);

    return sendSuccess(
      res,
      {
        message: 'Usuario registrado. Por favor, verifique su cuenta con el código enviado.',
        userId,
        requiresVerification: true,
      },
      201
    );
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'auth.register');
  }
};

exports.verifyAccount = async (req, res) => {
  try {
    const { correo, codigo } = req.body;

    if (!correo || !codigo) {
      return sendError(res, 400, 'Correo y código son requeridos.');
    }

    const [users] = await pool.query(
      'SELECT idCliente FROM Cliente WHERE correo = ? AND codigoVerificacion = ?',
      [correo, codigo]
    );

    if (users.length === 0) {
      return sendError(res, 400, 'Código de verificación incorrecto.');
    }

    await pool.query('UPDATE Cliente SET activo = 1, codigoVerificacion = NULL WHERE idCliente = ?', [users[0].idCliente]);

    return sendSuccess(res, { message: 'Cuenta verificada exitosamente. Ya puede iniciar sesión.' });
  } catch (error) {
    return handleError(res, error, 'Error al verificar la cuenta.', 'auth.verifyAccount');
  }
};

exports.login = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    const normalizedEmail = normalizeEmail(correo);

    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      return sendError(res, 401, buildCredentialsError());
    }

    if (isAccountLocked(user)) {
      const minutesRemaining = Math.ceil((new Date(user.bloqueadoHasta).getTime() - Date.now()) / 60000);
      return sendError(res, 403, `Cuenta bloqueada temporalmente por exceso de intentos. Intente en ${minutesRemaining} minutos.`);
    }

    if (user.activo === 0) {
      return sendError(res, 403, 'Su cuenta aún no ha sido verificada.', { requiresVerification: true });
    }

    const match = await bcrypt.compare(contrasena, user.contrasenaHash);
    if (!match) {
      const failedAttempts = Number(user.intentosFallidos || 0) + 1;
      const blockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null;

      await updateFailedAttempts(user.idCliente, failedAttempts, blockedUntil);
      return sendError(res, 401, blockedUntil ? buildLockoutMessage(LOCKOUT_MINUTES) : buildCredentialsError());
    }

    await resetFailedAttempts(user.idCliente);

    const token = getJwtToken(user);

    return sendSuccess(res, {
      message: 'Login exitoso',
      data: {
        token,
        user: buildUserDto(user),
      },
    });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'auth.login');
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { telefono } = req.body;

    if (!telefono) {
      return sendError(res, 400, 'El teléfono es requerido.');
    }

    const user = await findUserByPhone(telefono);
    if (!user) {
      return sendError(res, 404, 'Este Numero no esta Vinculada a una cuenta Cliente en LA Tienda');
    }

    const verificationCode = generateVerificationCode();
    const expirationDate = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'UPDATE Cliente SET codigoRecuperacion = ?, expiracionCodigo = ? WHERE idCliente = ?',
      [verificationCode, expirationDate, user.idCliente]
    );

    console.log('------------------------------------------------');
    console.log(`SMS PARA: ${telefono}`);
    console.log(`Hola ${user.nombre}, tu código de recuperación de Pure Inka es: ${verificationCode}`);
    console.log('------------------------------------------------');

    return sendSuccess(res, { message: 'Se ha enviado un código de recuperación a tu teléfono.' });
  } catch (error) {
    return handleError(res, error, 'Error al procesar la solicitud.', 'auth.forgotPassword');
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { telefono, codigo, nuevaContrasena } = req.body;

    if (!telefono || !codigo || !nuevaContrasena) {
      return sendError(res, 400, 'Todos los campos son requeridos.');
    }

    const [users] = await pool.query(
      'SELECT idCliente FROM Cliente WHERE telefono = ? AND codigoRecuperacion = ? AND expiracionCodigo > NOW()',
      [telefono, codigo]
    );

    if (users.length === 0) {
      return sendError(res, 400, 'Código inválido o expirado.');
    }

    const contrasenaHash = await hashPassword(nuevaContrasena);
    await pool.query('UPDATE Cliente SET contrasenaHash = ?, codigoRecuperacion = NULL, expiracionCodigo = NULL WHERE idCliente = ?', [contrasenaHash, users[0].idCliente]);

    return sendSuccess(res, { message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    return handleError(res, error, 'Error al restablecer la contraseña.', 'auth.resetPassword');
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return sendError(res, 400, 'Token de Google faltante.');
    }

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${googleToken}`);
    if (!response.ok) {
      return sendError(res, 400, 'Token de Google inválido.');
    }

    const payload = await response.json();
    const { email, name, email_verified } = payload;

    if (!email_verified) {
      return sendError(res, 400, 'El correo de Google no está verificado.');
    }

    const normalizedEmail = normalizeEmail(email);
    let user = await findUserByEmail(normalizedEmail);

    if (!user) {
      const dummyPass = Math.random().toString(36).slice(-10);
      const contrasenaHash = await hashPassword(dummyPass);
      const [result] = await pool.query(
        'INSERT INTO Cliente (nombre, correo, contrasenaHash, rol, activo) VALUES (?, ?, ?, "cliente", 1)',
        [name || 'Usuario Google', normalizedEmail, contrasenaHash]
      );

      const [newUser] = await pool.query('SELECT * FROM Cliente WHERE idCliente = ?', [result.insertId]);
      user = newUser[0];
    } else {
      if (!user.activo) {
        await pool.query('UPDATE Cliente SET activo = 1 WHERE idCliente = ?', [user.idCliente]);
        user.activo = 1;
      }
      await resetFailedAttempts(user.idCliente);
    }

    const token = getJwtToken(user);

    return sendSuccess(res, {
      message: 'Login con Google exitoso',
      data: {
        token,
        user: buildUserDto(user)
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error al procesar el login de Google.', 'auth.googleLogin');
  }
};
