
const request = require('supertest');
const express = require('express');
const userController = require('../src/controllers/user.controller');

// Mocking pool
jest.mock('../src/config/db', () => ({
  query: jest.fn(),
  getConnection: jest.fn().mockReturnValue({
    query: jest.fn(),
    release: jest.fn()
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

app.get('/profile', userController.getProfile);
app.put('/profile', userController.updateProfile);
app.get('/addresses', userController.getAddresses);
app.post('/addresses', userController.addAddress);

describe('User Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /profile', () => {
    it('should return user profile with addresses', async () => {
      pool.query.mockResolvedValueOnce([
        [{ idCliente: 1, nombre: 'John Doe', correo: 'john@example.com' }]
      ]); // User query
      pool.query.mockResolvedValueOnce([
        [{ idDireccion: 1, direccion: 'Calle Falsa 123' }]
      ]); // Addresses query

      const res = await request(app).get('/profile');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('John Doe');
      expect(res.body.data.direcciones.length).toBe(1);
    });

    it('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/profile');

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /addresses', () => {
    it('should add a new address', async () => {
      pool.query.mockResolvedValueOnce([{ insertId: 10 }]); // Insert
      pool.query.mockResolvedValueOnce([[{ idDireccion: 10, direccion: 'New St' }]]); // Select new

      const res = await request(app)
        .post('/addresses')
        .send({
          direccion: 'New St',
          distrito: 'Distrito 1',
          ciudad: 'Lima'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.direccion).toBe('New St');
    });
  });
});
