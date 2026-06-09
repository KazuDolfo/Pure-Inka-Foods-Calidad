
const request = require('supertest');
const express = require('express');
const productController = require('../src/controllers/product.controller');

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
app.get('/products', productController.getAllProducts);
app.get('/products/:id', productController.getProductById);
app.post('/products', productController.createProduct);

describe('Product Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /products', () => {
    it('should return a list of products', async () => {
      pool.query.mockResolvedValueOnce([
        [{ idProducto: 1, nombre: 'Miel de Abeja', precio: 25.50, stock: 10, imagen: 'miel.png' }]
      ]);

      const res = await request(app).get('/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].nombre).toBe('Miel de Abeja');
    });
  });

  describe('GET /products/:id', () => {
    it('should return a product by id', async () => {
      pool.query.mockResolvedValueOnce([
        [{ idProducto: 1, nombre: 'Miel de Abeja', precio: 25.50 }]
      ]);

      const res = await request(app).get('/products/1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe('Miel de Abeja');
    });

    it('should return 404 if product not found', async () => {
      pool.query.mockResolvedValueOnce([[]]);

      const res = await request(app).get('/products/999');

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
