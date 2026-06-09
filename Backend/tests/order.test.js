
const request = require('supertest');
const express = require('express');
const orderController = require('../src/controllers/order.controller');

// Mocking pool
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn().mockReturnValue({
    query: jest.fn(),
    release: jest.fn(),
    beginTransaction: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn()
  })
}));

const pool = require('../src/config/db');

const app = express();
app.use(express.json());

// Mock middleware to set req.user
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

app.get('/my-orders', orderController.getMyOrders);
app.get('/orders/:id', orderController.getOrderDetails);

describe('Order Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /my-orders', () => {
    it('should return user orders', async () => {
      pool.query.mockResolvedValueOnce([
        [{ idPedido: 1, totalPagar: 100.00, estado: 'PENDIENTE' }]
      ]);

      const res = await request(app).get('/my-orders');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('GET /orders/:id', () => {
    it('should return order details if owner', async () => {
      pool.query.mockResolvedValueOnce([[{ idPedido: 1 }]]); // Ownership check
      pool.query.mockResolvedValueOnce([
        [{ idProducto: 1, producto_nombre: 'Miel', cantidad: 2 }]
      ]);

      const res = await request(app).get('/orders/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });

    it('should return 403 if not owner', async () => {
      pool.query.mockResolvedValueOnce([[]]); // Ownership check fails

      const res = await request(app).get('/orders/1');

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
    });
  });
});
