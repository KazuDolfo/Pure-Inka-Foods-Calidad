
const pool = require('../config/db');
const { generateInvoice } = require('../utils/pdf-generator');

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await pool.query(
      `SELECT p.idPedido, p.fecha, p.estado, p.totalProductos, p.costoEnvio, p.totalPagar, 
              p.idPedido as id_pedido, p.fecha as fecha_pedido, p.totalPagar as total,
              cp.rutaPDF as boleta_url
       FROM pedido p 
       LEFT JOIN pago pg ON p.idPedido = pg.idPedido
       LEFT JOIN comprobantepago cp ON pg.idPago = cp.idPago
       WHERE p.idCliente = ? 
       ORDER BY p.fecha DESC`,
      [userId]
    );

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    
    const [orderCheck] = await pool.query('SELECT idPedido FROM pedido WHERE idPedido = ? AND idCliente = ?', [id, userId]);
    if (orderCheck.length === 0) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para ver este pedido.' });
    }

    const [details] = await pool.query(
      `SELECT dp.*, p.nombre as producto_nombre, p.imagen, dp.precioUnitario as precio_unitario 
       FROM detallepedido dp
       JOIN producto p ON dp.idProducto = p.idProducto
       WHERE dp.idPedido = ?`,
      [id]
    );

    res.json({ success: true, data: details });
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { id_direccion_envio, id_tipo_entrega, metodo_pago, items, subtotal, costo_envio, total } = req.body;
    const comprobante_pago = req.file ? req.file.filename : null;

    const cleanDireccionId = parseInt(id_direccion_envio);
    const cleanEntregaId = parseInt(id_tipo_entrega);

    if (!items) {
        return res.status(400).json({ success: false, message: 'No hay productos en el pedido.' });
    }

    const cartItems = JSON.parse(items);
    if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'El carrito está vacío.' });
    }

    await connection.beginTransaction();

    const isCard = metodo_pago && (metodo_pago.toLowerCase() === 'card' || metodo_pago.toLowerCase() === 'tarjeta');
    const initialStatus = isCard ? 'PAGADO' : 'PENDIENTE';

    const [orderResult] = await connection.query(
      `INSERT INTO pedido (idCliente, idTipoEntrega, idDireccion, fecha, estado, totalProductos, costoEnvio, totalPagar, metodoPago, comprobantePago)
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
      [userId, cleanEntregaId, cleanDireccionId, initialStatus, subtotal, costo_envio, total, metodo_pago, comprobante_pago]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      const productId = item.idProducto || item.id || item.id_producto || (item.product ? (item.product.idProducto || item.product.id) : null);
      const subtotalItem = (item.price || 0) * (item.quantity || 0);

      await connection.query(
        'INSERT INTO detallepedido (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderId, productId, item.quantity, item.price || 0, subtotalItem]
      );

      await connection.query(
        'UPDATE producto SET stock = stock - ? WHERE idProducto = ?',
        [item.quantity, productId]
      );
    }

    await connection.commit();

    if (initialStatus === 'PAGADO') {
      try {
        const [[order]] = await pool.query('SELECT * FROM pedido WHERE idPedido = ?', [orderId]);
        const [details] = await pool.query(`
          SELECT dp.*, p.nombre as producto_nombre 
          FROM detallepedido dp 
          JOIN producto p ON dp.idProducto = p.idProducto 
          WHERE dp.idPedido = ?`, [orderId]);
        const [[customer]] = await pool.query('SELECT nombre, correo, telefono FROM cliente WHERE idCliente = ?', [userId]);

        const { fileName } = await generateInvoice(order, details, customer);

        const [pagoRes] = await pool.query(
          'INSERT INTO pago (idPedido, idMetodoPago, monto, estado, referenciaExterna) VALUES (?, ?, ?, ?, ?)',
          [orderId, 1, total, 'COMPLETADO', 'STRIPE_AUTO']
        );

        await pool.query(
          'INSERT INTO comprobantepago (idPago, tipo, monto, rutaPDF) VALUES (?, ?, ?, ?)',
          [pagoRes.insertId, 'Boleta', total, `/uploads/invoices/${fileName}`]
        );
      } catch (pdfErr) {
        console.error('Error generando boleta automática:', pdfErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente.',
      data: { id: orderId }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al crear pedido:', error);
    res.status(500).json({ success: false, message: 'Error al procesar el pedido: ' + error.message });
  } finally {
    connection.release();
  }
};

