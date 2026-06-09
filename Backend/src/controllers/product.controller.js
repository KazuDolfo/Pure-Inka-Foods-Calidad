const pool = require('../config/db');
const {
  sendSuccess,
  sendError,
  handleError,
  mapProductForApi,
  optimizeUploadedImage,
  buildUpdateQuery,
  PRODUCT_UPLOAD_DIR,
} = require('../utils/controller-helpers');

const SORT_OPTIONS = {
  price_asc: 'p.precio ASC',
  price_desc: 'p.precio DESC',
  name_asc: 'p.nombre ASC',
  name_desc: 'p.nombre DESC',
  oldest: 'p.idProducto ASC',
};

const PRODUCT_LIST_BASE = `
  SELECT p.*, c.nombre as categoriaNombre,
         COALESCE(AVG(r.calificacion), 0) as promedioResenas,
         COUNT(r.idResena) as totalResenas
  FROM Producto p
  LEFT JOIN Categoria c ON p.idCategoria = c.idCategoria
  LEFT JOIN resena r ON p.idProducto = r.idProducto
  WHERE p.activo = TRUE
`;

function normalizePagination(query) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 12;
  return { page, limit, offset: (page - 1) * limit };
}

function getOrderBy(sort) {
  return SORT_OPTIONS[sort] || 'p.idProducto DESC';
}

function buildProductListQuery(queryParams) {
  let query = PRODUCT_LIST_BASE;
  const params = [];

  if (queryParams.search) {
    query += ' AND (p.nombre LIKE ? OR p.descripcion LIKE ?)';
    params.push(`%${queryParams.search}%`, `%${queryParams.search}%`);
  }

  if (queryParams.category) {
    query += ' AND p.idCategoria = ?';
    params.push(queryParams.category);
  }

  query += ' GROUP BY p.idProducto';

  query += ` ORDER BY ${getOrderBy(queryParams.sort)} LIMIT ? OFFSET ?`;
  params.push(Number(queryParams.limit), Number(queryParams.offset));

  return { query, params };
}

function getProductInsertData(body, file) {
  return {
    nombre: body.nombre,
    descripcion: body.descripcion,
    idCategoria: body.id_categoria,
    precio: body.precio_unitario,
    stock: body.stock || 0,
    imagen: file ? file.filename : null,
  };
}

function getProductUpdateData(body, file) {
  return {
    nombre: body.nombre,
    descripcion: body.descripcion,
    idCategoria: body.id_categoria,
    precio: body.precio_unitario,
    imagen: file ? file.filename : null,
  };
}

exports.getAllProducts = async (req, res) => {
  try {
    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search || '',
      category: req.query.category || null,
      sort: req.query.sort || 'newest',
    };

    const pagination = normalizePagination(queryParams);
    const { query, params } = buildProductListQuery({ ...queryParams, ...pagination });

    const [rows] = await pool.query(query, params);

    return sendSuccess(res, {
      data: rows.map(mapProductForApi),
      page: pagination.page,
      limit: pagination.limit,
    });
  } catch (error) {
    return handleError(res, error, 'Error al obtener productos', 'product.getAllProducts');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const productData = getProductInsertData(req.body, req.file);
    await optimizeUploadedImage(req.file, PRODUCT_UPLOAD_DIR, 600);

    const [result] = await pool.query(
      'INSERT INTO Producto (nombre, descripcion, idCategoria, precio, stock, imagen, activo) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      [
        productData.nombre,
        productData.descripcion,
        productData.idCategoria,
        productData.precio,
        productData.stock,
        productData.imagen,
      ]
    );

    return sendSuccess(
      res,
      {
        message: 'Producto creado exitosamente',
        data: { id: result.insertId },
      },
      201
    );
  } catch (error) {
    return handleError(res, error, `Error al crear producto: ${error.message}`, 'product.createProduct');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = getProductUpdateData(req.body, req.file);
    await optimizeUploadedImage(req.file, PRODUCT_UPLOAD_DIR, 600);

    const { query, params } = buildUpdateQuery(
      'UPDATE Producto SET nombre = ?, descripcion = ?, idCategoria = ?, precio = ?',
      [productData.nombre, productData.descripcion, productData.idCategoria, productData.precio],
      [{ column: 'imagen', value: productData.imagen }]
    );

    await pool.query(`${query} WHERE idProducto = ?`, [...params, productId]);
    return sendSuccess(res, { message: 'Producto actualizado exitosamente' });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar producto', 'product.updateProduct');
  }
};

exports.updateStock = async (req, res) => {
  try {
    const productId = req.params.id;
    const { cantidad } = req.body;
    await pool.query('UPDATE Producto SET stock = ? WHERE idProducto = ?', [cantidad, productId]);
    return sendSuccess(res, { message: 'Stock actualizado' });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar stock', 'product.updateStock');
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    await pool.query('UPDATE Producto SET activo = FALSE WHERE idProducto = ?', [productId]);
    return sendSuccess(res, { message: 'Producto eliminado' });
  } catch (error) {
    return handleError(res, error, 'Error al eliminar producto', 'product.deleteProduct');
  }
};

exports.getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const [rows] = await pool.query(
      `SELECT p.*, COALESCE(AVG(r.calificacion), 0) as promedioResenas, COUNT(r.idResena) as totalResenas 
       FROM Producto p 
       LEFT JOIN resena r ON p.idProducto = r.idProducto 
       WHERE p.idProducto = ? 
       GROUP BY p.idProducto`,
      [productId]
    );

    if (rows.length === 0) {
      return sendError(res, 404, 'No encontrado');
    }

    return sendSuccess(res, { data: mapProductForApi(rows[0]) });
  } catch (error) {
    return handleError(res, error, 'Error al obtener producto por ID', 'product.getProductById');
  }
};

exports.getRelatedProducts = async (req, res) => {
  try {
    const productId = req.params.id;

    const [productRows] = await pool.query('SELECT idCategoria FROM Producto WHERE idProducto = ?', [productId]);
    if (productRows.length === 0) {
      return sendError(res, 404, 'Producto no encontrado');
    }

    const [relatedRows] = await pool.query(
      `SELECT p.*, COALESCE(AVG(r.calificacion), 0) as promedioResenas, COUNT(r.idResena) as totalResenas 
       FROM Producto p 
       LEFT JOIN resena r ON p.idProducto = r.idProducto 
       WHERE p.idCategoria = ? AND p.idProducto != ? AND p.activo = TRUE 
       GROUP BY p.idProducto 
       ORDER BY RAND() LIMIT 4`,
      [productRows[0].idCategoria, productId]
    );

    return sendSuccess(res, { data: relatedRows.map(mapProductForApi) });
  } catch (error) {
    return handleError(res, error, 'Error al obtener productos relacionados', 'product.getRelatedProducts');
  }
};
