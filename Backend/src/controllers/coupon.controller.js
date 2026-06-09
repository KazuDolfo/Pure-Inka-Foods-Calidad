const pool = require('../config/db');
const { sendSuccess, sendError, handleError } = require('../utils/controller-helpers');

exports.validateCoupon = async (req, res) => {
  try {
    const { codigo } = req.body;
    const idCliente = req.user.id;

    if (!codigo) {
      return sendError(res, 400, 'Debe proporcionar un código de cupón.');
    }

    const [rows] = await pool.query(
      'SELECT * FROM cupon WHERE codigo = ? AND activo = 1 AND fechaExpiracion > NOW() AND vecesUsado < limiteUso',
      [codigo]
    );

    if (rows.length === 0) {
      return sendError(res, 400, 'El cupón no es válido, ha expirado o ya no está activo.');
    }

    const coupon = rows[0];

    // Verificar si el usuario ya utilizó el cupón
    const [usage] = await pool.query(
      'SELECT 1 FROM cupon_cliente WHERE idCupon = ? AND idCliente = ?',
      [coupon.idCupon, idCliente]
    );

    if (usage.length > 0) {
      return sendError(res, 400, 'Ya has utilizado este cupón anteriormente.');
    }

    return sendSuccess(res, {
      message: 'Cupón válido.',
      data: {
        idCupon: coupon.idCupon,
        codigo: coupon.codigo,
        tipo: coupon.tipo,
        valor: Number(coupon.valor)
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error al validar el cupón.', 'coupon.validateCoupon');
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const { codigo, tipo, valor, fechaExpiracion, limiteUso } = req.body;

    if (!codigo || !tipo || !valor || !fechaExpiracion) {
      return sendError(res, 400, 'Todos los campos obligatorios (codigo, tipo, valor, fechaExpiracion) deben ser completados.');
    }

    if (tipo !== 'porcentaje' && tipo !== 'fijo') {
      return sendError(res, 400, 'El tipo de cupón debe ser "porcentaje" o "fijo".');
    }

    await pool.query(
      'INSERT INTO cupon (codigo, tipo, valor, fechaExpiracion, limiteUso) VALUES (?, ?, ?, ?, ?)',
      [codigo.toUpperCase(), tipo, valor, fechaExpiracion, limiteUso || 9999]
    );

    return sendSuccess(res, { message: 'Cupón registrado con éxito.' }, 201);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return sendError(res, 400, 'El código de cupón ya está registrado.');
    }
    return handleError(res, error, 'Error al registrar el cupón.', 'coupon.createCoupon');
  }
};
