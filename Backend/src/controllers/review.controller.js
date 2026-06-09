const pool = require('../config/db');
const { sendSuccess, sendError, handleError } = require('../utils/controller-helpers');

exports.createReview = async (req, res) => {
  try {
    const { idProducto, calificacion, comentario } = req.body;
    const idCliente = req.user.id;

    if (!idProducto || !calificacion) {
      return sendError(res, 400, 'Debe especificar el producto y la calificación.');
    }

    if (calificacion < 1 || calificacion > 5) {
      return sendError(res, 400, 'La calificación debe estar entre 1 y 5.');
    }

    // 1. Verificar si compró el producto
    const [purchases] = await pool.query(
      `SELECT dp.idProducto 
       FROM detallepedido dp 
       JOIN pedido p ON dp.idPedido = p.idPedido 
       WHERE p.idCliente = ? AND dp.idProducto = ? AND p.estado IN ('PAGADO', 'ENVIADO', 'ENTREGADO')`,
      [idCliente, idProducto]
    );

    if (purchases.length === 0) {
      return sendError(res, 403, 'Solo puedes calificar productos que hayas comprado y pagado.');
    }

    // 2. Verificar si ya opinó
    const [existing] = await pool.query(
      'SELECT idResena FROM resena WHERE idProducto = ? AND idCliente = ?',
      [idProducto, idCliente]
    );

    if (existing.length > 0) {
      // Si ya opinó, actualizamos su opinión
      await pool.query(
        'UPDATE resena SET calificacion = ?, comentario = ?, fecha = NOW() WHERE idProducto = ? AND idCliente = ?',
        [calificacion, comentario, idProducto, idCliente]
      );
      return sendSuccess(res, { message: 'Tu reseña ha sido actualizada.' });
    } else {
      // Si es nueva, la insertamos
      await pool.query(
        'INSERT INTO resena (idProducto, idCliente, calificacion, comentario) VALUES (?, ?, ?, ?)',
        [idProducto, idCliente, calificacion, comentario]
      );
      return sendSuccess(res, { message: 'Reseña registrada con éxito.' }, 201);
    }
  } catch (error) {
    return handleError(res, error, 'Error al registrar la reseña.', 'review.createReview');
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { idProducto } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.idResena, r.calificacion, r.comentario, r.fecha, c.nombre as cliente_nombre 
       FROM resena r 
       JOIN cliente c ON r.idCliente = c.idCliente 
       WHERE r.idProducto = ? 
       ORDER BY r.fecha DESC`,
      [idProducto]
    );

    const [avgResult] = await pool.query(
      'SELECT AVG(calificacion) as promedio, COUNT(*) as total FROM resena WHERE idProducto = ?',
      [idProducto]
    );

    const promedio = avgResult[0] && avgResult[0].promedio ? Number(Number(avgResult[0].promedio).toFixed(1)) : 0;
    const total = avgResult[0] ? avgResult[0].total : 0;

    return sendSuccess(res, {
      data: {
        reviews,
        promedio,
        total
      }
    });
  } catch (error) {
    return handleError(res, error, 'Error al obtener las reseñas del producto.', 'review.getProductReviews');
  }
};
