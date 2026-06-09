const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas de cliente (requieren estar autenticado)
router.post('/', authMiddleware, ticketController.createTicket);
router.get('/my-tickets', authMiddleware, ticketController.getClientTickets);

// Rutas de administrador (requieren rol admin)
router.get('/admin/all', authMiddleware, authMiddleware.isAdmin, ticketController.getAdminTickets);
router.put('/admin/respond/:idTicket', authMiddleware, authMiddleware.isAdmin, ticketController.respondTicket);

module.exports = router;
