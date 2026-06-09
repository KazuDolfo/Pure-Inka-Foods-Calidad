const request = require('supertest');
const express = require('express');
const ticketController = require('../src/controllers/ticket.controller');

// Mocking pool
jest.mock('../src/config/db', () => ({
  query: jest.fn()
}));

const pool = require('../src/config/db');

const app = express();
app.use(express.json());

// Mock auth middleware for client route
app.use((req, res, next) => {
  req.user = { id: 1, rol: 'cliente' };
  next();
});

app.post('/tickets', ticketController.createTicket);
app.get('/tickets/my-tickets', ticketController.getClientTickets);

// Separate router for admin requests to simulate admin context
const adminApp = express();
adminApp.use(express.json());
adminApp.use((req, res, next) => {
  req.user = { id: 2, rol: 'admin' };
  next();
});
adminApp.get('/tickets/admin/all', ticketController.getAdminTickets);
adminApp.put('/tickets/admin/respond/:idTicket', ticketController.respondTicket);

describe('Ticket Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tickets (createTicket)', () => {
    it('should create a ticket successfully', async () => {
      pool.query.mockResolvedValueOnce([{ insertId: 5 }]);

      const res = await request(app)
        .post('/tickets')
        .send({
          asunto: 'Error en checkout',
          descripcion: 'No puedo pagar con Yape',
          categoria: 'Soporte Técnico'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.asunto).toBe('Error en checkout');
      expect(res.body.data.estado).toBe('ABIERTO');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/tickets')
        .send({
          asunto: 'Error en checkout'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /tickets/my-tickets (getClientTickets)', () => {
    it('should return client tickets', async () => {
      pool.query.mockResolvedValueOnce([
        [
          { idTicket: 1, asunto: 'Duda con pedido', descripcion: '...', categoria: 'Duda', estado: 'ABIERTO' }
        ]
      ]);

      const res = await request(app).get('/tickets/my-tickets');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].asunto).toBe('Duda con pedido');
    });
  });

  describe('Admin ticket routes', () => {
    it('should list all tickets for admin', async () => {
      pool.query.mockResolvedValueOnce([
        [
          { idTicket: 1, asunto: 'Duda', descripcion: '...', categoria: 'Duda', cliente_nombre: 'John Doe' }
        ]
      ]);

      const res = await request(adminApp).get('/tickets/admin/all');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].cliente_nombre).toBe('John Doe');
    });

    it('should respond to a ticket successfully', async () => {
      pool.query.mockResolvedValueOnce([[{ idTicket: 1 }]]); // checkTicket
      pool.query.mockResolvedValueOnce([{}]); // update query

      const res = await request(adminApp)
        .put('/tickets/admin/respond/1')
        .send({
          respuesta: 'Se resolvió el inconveniente.',
          estado: 'RESPONDIDO'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
    });
  });
});
