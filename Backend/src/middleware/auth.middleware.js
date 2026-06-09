
const jwt = require('jsonwebtoken');

function unauthorizedResponse(res, message) {
  return res.status(401).json({ success: false, message });
}

function forbiddenResponse(res, message) {
  return res.status(403).json({ success: false, message });
}

function getBearerToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}

const verifyToken = (req, res, next) => {
  const token = getBearerToken(req.headers.authorization);
  if (!token) {
    return unauthorizedResponse(res, 'Acceso no autorizado. Token faltante.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return unauthorizedResponse(res, 'Token inválido o expirado.');
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    return next();
  }

  return forbiddenResponse(res, 'Acceso denegado. Se requiere rol de administrador.');
};

module.exports = verifyToken;
module.exports.isAdmin = isAdmin;
