const pool = require('../config/db');
const {
  sendSuccess,
  handleError,
  ensureUserCart,
} = require('../utils/controller-helpers');

const CART_ITEMS_QUERY = `
  SELECT dc.idProducto, dc.cantidad, p.nombre, p.precio, p.imagen, p.stock
  FROM detallecarrito dc
  JOIN producto p ON dc.idProducto = p.idProducto
  WHERE dc.idCarrito = ?
`;

function parseCartItems(items) {
  if (!items) return [];
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  return Array.isArray(parsedItems) ? parsedItems : [];
}

function resolveCartItemProductId(item) {
  return item.id || item.idProducto;
}

async function insertCartItem(connection, cartId, item) {
  const productId = resolveCartItemProductId(item);
  if (!productId) return;

  await connection.query(
    'INSERT INTO detallecarrito (idCarrito, idProducto, cantidad) VALUES (?, ?, ?)',
    [cartId, productId, item.quantity]
  );
}

exports.getCart = async (req, res) => {
  try {
    const cart = await ensureUserCart(pool, req.user.id);
    const [items] = await pool.query(CART_ITEMS_QUERY, [cart.idCarrito]);
    return sendSuccess(res, { data: items });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'cart.getCart');
  }
};

exports.syncCart = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const cart = await ensureUserCart(connection, req.user.id);
    const items = parseCartItems(req.body.items);

    await connection.beginTransaction();
    await connection.query('DELETE FROM detallecarrito WHERE idCarrito = ?', [cart.idCarrito]);

    for (const item of items) {
      await insertCartItem(connection, cart.idCarrito, item);
    }

    await connection.commit();
    return sendSuccess(res, { message: 'Carrito sincronizado.' });
  } catch (error) {
    await connection.rollback();
    return handleError(res, error, 'Error al sincronizar.', 'cart.syncCart');
  } finally {
    connection.release();
  }
};

exports.clearCart = async (req, res) => {
  try {
    const [[cart]] = await pool.query('SELECT idCarrito FROM carrito WHERE idCliente = ?', [req.user.id]);

    if (cart) {
      await pool.query('DELETE FROM detallecarrito WHERE idCarrito = ?', [cart.idCarrito]);
    }

    return sendSuccess(res, { message: 'Carrito vaciado.' });
  } catch (error) {
    return handleError(res, error, 'Error interno.', 'cart.clearCart');
  }
};
