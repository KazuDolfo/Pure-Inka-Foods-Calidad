const pool = require('../config/db');
const { sendSuccess, handleError } = require('../utils/controller-helpers');

const CATEGORY_SELECT_QUERY = 'SELECT *, idCategoria as id_categoria, nombre as nombre_categoria FROM Categoria';

exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(CATEGORY_SELECT_QUERY);
    return sendSuccess(res, { data: categories });
  } catch (error) {
    return handleError(res, error, 'Error al obtener categorías', 'category.getAllCategories');
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    const [result] = await pool.query(
      'INSERT INTO Categoria (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );

    return sendSuccess(res, {
      message: 'Categoría creada exitosamente',
      data: { id: result.insertId },
    }, 201);
  } catch (error) {
    return handleError(res, error, 'Error al crear categoría', 'category.createCategory');
  }
};
