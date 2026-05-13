
const pool = require('../config/db');

exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT *, idCategoria as id_categoria, nombre as nombre_categoria FROM Categoria');
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const [result] = await pool.query(
      'INSERT INTO Categoria (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría'
    });
  }
};
