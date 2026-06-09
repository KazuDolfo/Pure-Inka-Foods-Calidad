const pool = require('../config/db');
const {
  sendSuccess,
  sendError,
  handleError,
  isCardPayment,
  parseCartItems,
  getProductIdFromCartItem,
  generateOrderInvoice,
  optimizeUploadedImage,
  VOUCHER_UPLOAD_DIR,
} = require('../utils/controller-helpers');

const MY_ORDERS_QUERY = `
  SELECT p.idPedido, p.fecha, p.estado, p.totalProductos, p.costoEnvio, p.totalPagar, p.comprobantePago,
         p.idPedido as id_pedido, p.fecha as fecha_pedido, p.totalPagar as total,
         cp.rutaPDF as boleta_url
  FROM pedido p
  LEFT JOIN pago pg ON p.idPedido = pg.idPedido
  LEFT JOIN comprobantepago cp ON pg.idPago = cp.idPago
  WHERE p.idCliente = ?
  ORDER BY p.fecha DESC
`;

const ORDER_DETAILS_QUERY = `
  SELECT dp.*, p.nombre as producto_nombre, p.imagen, dp.precioUnitario as precio_unitario
  FROM detallepedido dp
  JOIN producto p ON dp.idProducto = p.idProducto
  WHERE dp.idPedido = ?
`;

const PAYMENT_METHOD_ID_QUERY = 'SELECT idMetodoPago FROM MetodoPago WHERE nombre = ?';

function getOrderStatus(metodoPago) {
  return isCardPayment(metodoPago) ? 'PAGADO' : 'PENDIENTE';
}

function getPaymentStatus(orderStatus) {
  return orderStatus === 'PAGADO' ? 'COMPLETADO' : 'PENDIENTE';
}

function getPaymentReference(metodoPago) {
  return isCardPayment(metodoPago) ? 'STRIPE_AUTO' : 'USER_UPLOAD';
}

async function fetchPaymentMethodId(connection, metodoPago) {
  const [rows] = await connection.query(PAYMENT_METHOD_ID_QUERY, [String(metodoPago || '').toLowerCase()]);
  return rows[0] ? rows[0].idMetodoPago : 1;
}

async function insertOrder(connection, orderData) {
  const {
    userId,
    shippingTypeId,
    shippingAddressId,
    orderStatus,
    subtotal,
    shippingCost,
    total,
    paymentMethod,
    invoiceType,
    ruc,
    razonSocial,
    voucherPath,
    idCupon,
    descuento,
  } = orderData;

  const [result] = await connection.query(
    `INSERT INTO pedido (idCliente, idTipoEntrega, idDireccion, fecha, estado, totalProductos, costoEnvio, totalPagar, metodoPago, tipoComprobante, ruc, razonSocial, comprobantePago, idCupon, descuento)
     VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      shippingTypeId,
      shippingAddressId,
      orderStatus,
      subtotal,
      shippingCost,
      total,
      paymentMethod,
      invoiceType,
      ruc,
      razonSocial,
      voucherPath,
      idCupon,
      descuento,
    ]
  );

  return result.insertId;
}

async function insertPayment(connection, orderId, total, metodoPago, orderStatus) {
  const paymentMethodId = await fetchPaymentMethodId(connection, metodoPago);
  const paymentStatus = getPaymentStatus(orderStatus);
  const paymentReference = getPaymentReference(metodoPago);

  await connection.query(
    'INSERT INTO pago (idPedido, idMetodoPago, monto, estado, referenciaExterna) VALUES (?, ?, ?, ?, ?)',
    [orderId, paymentMethodId, total, paymentStatus, paymentReference]
  );
}

async function insertOrderDetails(connection, orderId, cartItems) {
  for (const item of cartItems) {
    const productId = getProductIdFromCartItem(item);
    const quantity = item.quantity || 0;
    const unitPrice = item.price || 0;
    const subtotalItem = unitPrice * quantity;

    await connection.query(
      'INSERT INTO detallepedido (idPedido, idProducto, cantidad, precioUnitario, subtotal) VALUES (?, ?, ?, ?, ?)',
      [orderId, productId, quantity, unitPrice, subtotalItem]
    );

    await connection.query(
      'UPDATE producto SET stock = stock - ? WHERE idProducto = ?',
      [quantity, productId]
    );
  }
}

async function verifyOrderOwnership(connection, orderId, userId) {
  const [rows] = await connection.query('SELECT idPedido FROM pedido WHERE idPedido = ? AND idCliente = ?', [orderId, userId]);
  return rows.length > 0;
}

async function getOrderState(connection, orderId, userId) {
  const [rows] = await connection.query('SELECT idPedido, estado FROM pedido WHERE idPedido = ? AND idCliente = ?', [orderId, userId]);
  return rows[0] || null;
}

exports.getMyOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(MY_ORDERS_QUERY, [req.user.id]);
    return sendSuccess(res, { data: orders });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'order.getMyOrders');
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!(await verifyOrderOwnership(pool, orderId, req.user.id))) {
      return sendError(res, 403, 'No tienes permiso para ver este pedido.');
    }

    const [details] = await pool.query(ORDER_DETAILS_QUERY, [orderId]);
    return sendSuccess(res, { data: details });
  } catch (error) {
    return handleError(res, error, 'Error interno del servidor.', 'order.getOrderDetails');
  }
};

exports.createOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const orderPayload = {
      userId: req.user.id,
      shippingAddressId: parseInt(req.body.id_direccion_envio, 10),
      shippingTypeId: parseInt(req.body.id_tipo_entrega, 10),
      paymentMethod: req.body.metodo_pago,
      subtotal: req.body.subtotal,
      shippingCost: req.body.costo_envio,
      total: req.body.total,
      invoiceType: String(req.body.tipo_comprobante || 'BOLETA').toUpperCase(),
      ruc: req.body.ruc || null,
      razonSocial: req.body.razon_social || null,
      voucherPath: req.file ? `/uploads/comprobantes/${req.file.filename}` : null,
      idCupon: req.body.id_cupon ? parseInt(req.body.id_cupon, 10) : null,
      descuento: req.body.descuento ? parseFloat(req.body.descuento) : 0.00,
    };

    await optimizeUploadedImage(req.file, VOUCHER_UPLOAD_DIR, 800);

    const cartItems = parseCartItems(req.body.items);
    if (!cartItems || cartItems.length === 0) {
      return sendError(res, 400, 'No hay productos en el pedido.');
    }

    const orderStatus = getOrderStatus(orderPayload.paymentMethod);
    orderPayload.orderStatus = orderStatus;

    await connection.beginTransaction();

    const orderId = await insertOrder(connection, orderPayload);
    await insertPayment(connection, orderId, orderPayload.total, orderPayload.paymentMethod, orderStatus);
    await insertOrderDetails(connection, orderId, cartItems);

    if (orderPayload.idCupon) {
      await connection.query('UPDATE cupon SET vecesUsado = vecesUsado + 1 WHERE idCupon = ?', [orderPayload.idCupon]);
      await connection.query('INSERT INTO cupon_cliente (idCupon, idCliente) VALUES (?, ?)', [orderPayload.idCupon, orderPayload.userId]);
    }

    await connection.commit();

    if (orderStatus === 'PAGADO') {
      await generateOrderInvoice(orderId, { referenciaExterna: 'STRIPE_AUTO' });
    }

    return sendSuccess(res, { message: 'Pedido creado exitosamente.', data: { id: orderId } }, 201);
  } catch (error) {
    await connection.rollback();
    return handleError(res, error, `Error al procesar el pedido: ${error.message}`, 'order.createOrder');
  } finally {
    connection.release();
  }
};

exports.cancelOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const order = await getOrderState(connection, orderId, userId);
    if (!order) {
      return sendError(res, 404, 'Pedido no encontrado.');
    }

    if (order.estado !== 'PENDIENTE') {
      return sendError(res, 400, 'Solo se pueden cancelar pedidos en estado PENDIENTE.');
    }

    await connection.beginTransaction();
    await connection.query('UPDATE pedido SET estado = "CANCELADO" WHERE idPedido = ?', [orderId]);

    const [details] = await connection.query('SELECT idProducto, cantidad FROM detallepedido WHERE idPedido = ?', [orderId]);

    for (const item of details) {
      await connection.query('UPDATE producto SET stock = stock + ? WHERE idProducto = ?', [item.cantidad, item.idProducto]);
    }

    await connection.commit();
    return sendSuccess(res, { message: 'Pedido cancelado y stock devuelto exitosamente.' });
  } catch (error) {
    await connection.rollback();
    return handleError(res, error, 'Error al intentar cancelar el pedido.', 'order.cancelOrder');
  } finally {
    connection.release();
  }
};
