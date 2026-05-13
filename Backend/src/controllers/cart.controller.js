const pool = require('../config/db');

exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let [[cart]] = await pool.query('SELECT idCarrito FROM carrito WHERE idCliente = ?', [userId]);

    if (!cart) {
      const [result] = await pool.query('INSERT INTO carrito (idCliente) VALUES (?)', [userId]);
      cart = { idCarrito: result.insertId };
    }

    const [items] = await pool.query(`
      SELECT dc.idProducto, dc.cantidad, p.nombre, p.precio, p.imagen, p.stock
      FROM detallecarrito dc
      JOIN producto p ON dc.idProducto = p.idProducto
      WHERE dc.idCarrito = ?
    `, [cart.idCarrito]);

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.syncCart = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { items } = req.body; 

    await connection.beginTransaction();

    let [[cart]] = await connection.query('SELECT idCarrito FROM carrito WHERE idCliente = ?', [userId]);
    if (!cart) {
      const [result] = await connection.query('INSERT INTO carrito (idCliente) VALUES (?)', [userId]);
      cart = { idCarrito: result.insertId };
    }

    await connection.query('DELETE FROM detallecarrito WHERE idCarrito = ?', [cart.idCarrito]);

    if (items && items.length > 0) {
      for (const item of items) {
        const idProd = item.id || item.idProducto;
        if (idProd) {
          await connection.query(
            'INSERT INTO detallecarrito (idCarrito, idProducto, cantidad) VALUES (?, ?, ?)',
            [cart.idCarrito, idProd, item.quantity]
          );
        }
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Carrito sincronizado.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al sincronizar carrito:', error);
    res.status(500).json({ success: false, message: 'Error al sincronizar.' });
  } finally {
    connection.release();
  }
};

exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const [[cart]] = await pool.query('SELECT idCarrito FROM carrito WHERE idCliente = ?', [userId]);
    
    if (cart) {
      await pool.query('DELETE FROM detallecarrito WHERE idCarrito = ?', [cart.idCarrito]);
    }
    
    res.json({ success: true, message: 'Carrito vaciado.' });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({ success: false, message: 'Error interno.' });
  }
};