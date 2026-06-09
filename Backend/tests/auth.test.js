
const request = require('supertest');
process.env.JWT_SECRET = 'test_secret';
process.env.BCRYPT_SALT_ROUNDS = '10';
const express = require('express');
const authController = require('../src/controllers/auth.controller');

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
app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/google-login', authController.googleLogin);

describe('Auth Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user with status inactive and code', async () => {
      pool.query.mockResolvedValueOnce([[]]); // No existing user
      pool.query.mockResolvedValueOnce([{ insertId: 1 }]); // Insert successful

      const res = await request(app)
        .post('/register')
        .send({
          nombre: 'Test User',
          correo: 'test@example.com',
          telefono: '123456789',
          contrasena: 'password123'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.requiresVerification).toBe(true);
      expect(res.body.message).toContain('verifique su cuenta');
    });

    it('should return 400 if email already exists', async () => {
      pool.query.mockResolvedValueOnce([[{ idCliente: 1 }]]); // User exists

      const res = await request(app)
        .post('/register')
        .send({
          nombre: 'Test User',
          correo: 'test@example.com',
          telefono: '123456789',
          contrasena: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ya está registrado');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          nombre: 'Test User',
          correo: 'invalid-email',
          telefono: '123456789',
          contrasena: 'password123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('correo electrónico válido');
    });

    it('should return 400 for password too short', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          nombre: 'Test User',
          correo: 'test@example.com',
          telefono: '123456789',
          contrasena: '123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('al menos 6 caracteres');
    });
  });

  describe('POST /login', () => {
    it('should login successfully with correct credentials', async () => {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('password123', 10);

      pool.query.mockResolvedValueOnce([[{
        idCliente: 1,
        nombre: 'Test User',
        correo: 'test@example.com',
        contrasenaHash: hash,
        rol: 'cliente'
      }]]);

      const res = await request(app)
        .post('/login')
        .send({
          correo: 'test@example.com',
          contrasena: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      pool.query.mockResolvedValueOnce([[]]); // User not found

      const res = await request(app)
        .post('/login')
        .send({
          correo: 'wrong@example.com',
          contrasena: 'password123'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /google-login', () => {
    it('should login successfully with valid Google token for existing user', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'test@example.com',
          name: 'Test User',
          email_verified: true
        })
      });

      pool.query.mockResolvedValueOnce([[{
        idCliente: 1,
        nombre: 'Test User',
        correo: 'test@example.com',
        rol: 'cliente',
        activo: 1
      }]]);

      const res = await request(app)
        .post('/google-login')
        .send({ token: 'valid_google_token' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('should register and login new user if Google token is valid and user does not exist', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          email: 'new@example.com',
          name: 'New User',
          email_verified: true
        })
      });

      pool.query.mockResolvedValueOnce([[]]);
      pool.query.mockResolvedValueOnce([{ insertId: 2 }]);
      pool.query.mockResolvedValueOnce([[{
        idCliente: 2,
        nombre: 'New User',
        correo: 'new@example.com',
        rol: 'cliente',
        activo: 1
      }]]);

      const res = await request(app)
        .post('/google-login')
        .send({ token: 'valid_google_token' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.correo).toBe('new@example.com');
    });
  });
});
