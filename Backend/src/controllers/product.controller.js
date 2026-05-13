
const pool = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search = '', category = null } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.nombre as categoriaNombre 
      FROM Producto p 
      LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
      WHERE p.activo = TRUE
    `;
    const params = [];

    if (search) {
      query += ` AND (p.nombre LIKE ? OR p.descripcion LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND p.idCategoria = ?`;
      params.push(category);
    }

    query += ` ORDER BY p.idProducto DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);

    const mappedRows = rows.map(p => ({
      ...p,
      id: p.idProducto,
      idProducto: p.idProducto,
      name: p.nombre,
      nombre: p.nombre,
      description: p.descripcion,
      descripcion: p.descripcion,
      price: Number(p.precio),
      precio: Number(p.precio),
      stock: p.stock,
      id_categoria: p.idCategoria,
      idCategoria: p.idCategoria,
      image: p.imagen ? (p.imagen.startsWith('http') ? p.imagen : `http://localhost:5000/uploads/products/${p.imagen}`) : 'assets/pure-inka-logo.png'
    }));

    res.json({
      success: true,
      data: mappedRows,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener productos' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { nombre, descripcion, id_categoria, precio_unitario, stock = 0 } = req.body;
    const imagen = req.file ? req.file.filename : null;

    console.log('📦 Intentando crear producto:', { nombre, precio_unitario, imagen });

    const [result] = await pool.query(
      'INSERT INTO Producto (nombre, descripcion, idCategoria, precio, stock, imagen, activo) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      [nombre, descripcion, id_categoria, precio_unitario, stock, imagen]
    );

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: `Error al crear producto: ${error.message}`
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, id_categoria, precio_unitario } = req.body;
    const imagen = req.file ? req.file.filename : null;

    let query = 'UPDATE Producto SET nombre = ?, descripcion = ?, idCategoria = ?, precio = ?';
    const params = [nombre, descripcion, id_categoria, precio_unitario];

    if (imagen) {
      query += ', imagen = ?';
      params.push(imagen);
    }

    query += ' WHERE idProducto = ?';
    params.push(id);

    await pool.query(query, params);

    res.json({ success: true, message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar producto' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    await pool.query('UPDATE Producto SET stock = ? WHERE idProducto = ?', [cantidad, id]);
    res.json({ success: true, message: 'Stock actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar stock' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE Producto SET activo = FALSE WHERE idProducto = ?', [id]);
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar producto' });
  }
};

exports.getProductById = async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query('SELECT * FROM Producto WHERE idProducto = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'No encontrado' });
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error' });
    }
};
