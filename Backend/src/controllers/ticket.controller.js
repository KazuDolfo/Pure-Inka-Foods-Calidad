const pool = require('../config/db');
const { sendSuccess, sendError, handleError } = require('../utils/controller-helpers');

// Crear un nuevo ticket de soporte
exports.createTicket = async (req, res) => {
  try {
    const { asunto, descripcion, categoria } = req.body;
    const idCliente = req.user.id;

    if (!asunto || !descripcion || !categoria) {
      return sendError(res, 400, 'Los campos asunto, descripción y categoría son obligatorios.');
    }

    const [result] = await pool.query(
      'INSERT INTO ticket (idCliente, asunto, descripcion, categoria, estado) VALUES (?, ?, ?, ?, ?)',
      [idCliente, asunto, descripcion, categoria, 'ABIERTO']
    );

    return sendSuccess(res, {
      message: 'Ticket creado exitosamente.',
      data: {
        idTicket: result.insertId,
        idCliente,
        asunto,
        descripcion,
        categoria,
        estado: 'ABIERTO'
      }
    }, 201);
  } catch (error) {
    return handleError(res, error, 'Error al crear el ticket.', 'ticket.createTicket');
  }
};

// Obtener los tickets de un cliente autenticado
exports.getClientTickets = async (req, res) => {
  try {
    const idCliente = req.user.id;

    const [rows] = await pool.query(
      'SELECT idTicket, asunto, descripcion, categoria, estado, respuesta, fechaCreacion, fechaActualizacion FROM ticket WHERE idCliente = ? ORDER BY fechaCreacion DESC',
      [idCliente]
    );

    return sendSuccess(res, { data: rows });
  } catch (error) {
    return handleError(res, error, 'Error al obtener los tickets.', 'ticket.getClientTickets');
  }
};

// Obtener todos los tickets (Admin)
exports.getAdminTickets = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, c.nombre as cliente_nombre, c.correo as cliente_correo 
       FROM ticket t 
       JOIN cliente c ON t.idCliente = c.idCliente 
       ORDER BY t.fechaCreacion DESC`
    );

    return sendSuccess(res, { data: rows });
  } catch (error) {
    return handleError(res, error, 'Error al obtener todos los tickets.', 'ticket.getAdminTickets');
  }
};

// Responder y/o cambiar estado a un ticket (Admin)
exports.respondTicket = async (req, res) => {
  try {
    const { idTicket } = req.params;
    const { respuesta, estado } = req.body;

    if (!respuesta || !estado) {
      return sendError(res, 400, 'Los campos respuesta y estado son obligatorios.');
    }

    const validEstados = ['ABIERTO', 'RESPONDIDO', 'CERRADO'];
    if (!validEstados.includes(estado.toUpperCase())) {
      return sendError(res, 400, 'El estado del ticket no es válido (Debe ser ABIERTO, RESPONDIDO o CERRADO).');
    }

    const [checkTicket] = await pool.query('SELECT 1 FROM ticket WHERE idTicket = ?', [idTicket]);
    if (checkTicket.length === 0) {
      return sendError(res, 404, 'El ticket no existe.');
    }

    await pool.query(
      'UPDATE ticket SET respuesta = ?, estado = ? WHERE idTicket = ?',
      [respuesta, estado.toUpperCase(), idTicket]
    );

    return sendSuccess(res, { message: 'Ticket actualizado correctamente.' });
  } catch (error) {
    return handleError(res, error, 'Error al responder el ticket.', 'ticket.respondTicket');
  }
};
