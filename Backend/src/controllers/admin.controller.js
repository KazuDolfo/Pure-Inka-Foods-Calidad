const pool = require('../config/db');
const {
  sendSuccess,
  sendError,
  handleError,
  mapChartSeries,
  isValidOrderStatus,
  normalizeOrderStatus,
  generateOrderInvoice,
} = require('../utils/controller-helpers');

const ORDERS_LIST_QUERY = `
  SELECT p.*,
         c.nombre as cliente_nombre,
         c.correo as cliente_correo,
         d.direccion as envio_direccion,
         d.distrito as envio_distrito,
         d.nombre_receptor as envio_receptor,
         t.nombre as metodo_envio,
         cp.rutaPDF as boleta_url
  FROM pedido p
  JOIN cliente c ON p.idCliente = c.idCliente
  LEFT JOIN direccioncliente d ON p.idDireccion = d.idDireccion
  LEFT JOIN tipoentrega t ON p.idTipoEntrega = t.idTipoEntrega
  LEFT JOIN pago pg ON p.idPedido = pg.idPedido
  LEFT JOIN comprobantepago cp ON pg.idPago = cp.idPago
  ORDER BY p.fecha DESC
`;

async function fetchScalar(query, params = []) {
  const [[result]] = await pool.query(query, params);
  return result ? Object.values(result)[0] : 0;
}

async function fetchRows(query, params = []) {
  const [rows] = await pool.query(query, params);
  return rows;
}

function buildDashboardMetrics({ totalRevenue, orderCount, lowStockProducts, newUsers, pendingOrders }) {
  const avgOrderValue = orderCount > 0 ? Number((totalRevenue / orderCount).toFixed(2)) : 0;

  return {
    metrics: {
      totalRevenue: totalRevenue || 0,
      avgOrderValue,
      newUsers: newUsers || 0,
      pendingOrders: pendingOrders || 0,
      lowStockCount: lowStockProducts.length,
    },
    lowStockProducts,
  };
}

exports.getDashboardStats = async (req, res) => {
  try {
    const period = parseInt(req.query.period, 10) || 7;

    const totalRevenue = await fetchScalar(
      'SELECT SUM(totalPagar) as totalRevenue FROM pedido WHERE estado IN ("PAGADO", "ENVIADO", "ENTREGADO")'
    );

    const orderCount = await fetchScalar(
      'SELECT COUNT(*) as orderCount FROM pedido WHERE estado != "CANCELADO"'
    );

    const lowStockProducts = await fetchRows(
      'SELECT nombre, stock FROM producto WHERE stock < 5 AND activo = TRUE LIMIT 5'
    );

    const newUsers = await fetchScalar(
      'SELECT COUNT(*) as newUsers FROM cliente WHERE fechaRegistro >= DATE_SUB(CURDATE(), INTERVAL ? DAY)',
      [period]
    );

    const pendingOrders = await fetchScalar(
      'SELECT COUNT(*) as pendingOrders FROM pedido WHERE estado = "PENDIENTE"'
    );

    const salesSeries = mapChartSeries(
      await fetchRows(
        `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') as label, SUM(totalPagar) as data
         FROM pedido
         WHERE estado IN ("PAGADO", "ENVIADO", "ENTREGADO") AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY label
         ORDER BY label ASC`,
        [period]
      )
    );

    const statusSeries = mapChartSeries(
      await fetchRows('SELECT estado as label, COUNT(*) as data FROM pedido GROUP BY estado')
    );

    const paymentSeries = mapChartSeries(
      await fetchRows(
        `SELECT metodoPago as label, COUNT(*) as data
         FROM pedido
         WHERE estado != "CANCELADO"
         GROUP BY metodoPago`
      )
    );

    const topProductsSeries = mapChartSeries(
      await fetchRows(
        `SELECT p.nombre as label, SUM(dp.cantidad) as data
         FROM detallepedido dp
         JOIN producto p ON dp.idProducto = p.idProducto
         JOIN pedido ped ON dp.idPedido = ped.idPedido
         WHERE ped.estado IN ("PAGADO", "ENVIADO", "ENTREGADO")
         GROUP BY p.idProducto
         ORDER BY data DESC
         LIMIT 5`
      )
    );

    const dashboard = buildDashboardMetrics({
      totalRevenue,
      orderCount,
      lowStockProducts,
      newUsers,
      pendingOrders,
    });

    return sendSuccess(res, {
      data: {
        ...dashboard,
        charts: {
          sales: salesSeries,
          status: statusSeries,
          payments: paymentSeries,
          topProducts: topProductsSeries,
        },
      },
    });
  } catch (error) {
    return handleError(res, error, 'Error al obtener estadísticas.', 'admin.getDashboardStats');
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await fetchRows(ORDERS_LIST_QUERY);
    return sendSuccess(res, { data: orders });
  } catch (error) {
    return handleError(res, error, 'Error al obtener pedidos.', 'admin.getAllOrders');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!isValidOrderStatus(estado)) {
      return sendError(res, 400, 'Estado no válido.');
    }

    const nuevoEstado = normalizeOrderStatus(estado);
    await pool.query('UPDATE pedido SET estado = ? WHERE idPedido = ?', [nuevoEstado, id]);

    if (nuevoEstado === 'PAGADO') {
      await generateOrderInvoice(id, { markPaymentComplete: true });
    }

    return sendSuccess(res, {
      message: `Pedido #${id} actualizado a ${estado}.`,
    });
  } catch (error) {
    return handleError(res, error, 'Error al actualizar estado del pedido.', 'admin.updateOrderStatus');
  }
};

exports.getMessages = async (req, res) => sendSuccess(res, { data: [] });

exports.getDistributorRequests = async (req, res) => sendSuccess(res, { data: [] });

exports.getAllCoupons = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cupon ORDER BY idCupon DESC');
    return sendSuccess(res, { data: rows });
  } catch (error) {
    return handleError(res, error, 'Error al obtener cupones.', 'admin.getAllCoupons');
  }
};

exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    await pool.query('UPDATE cupon SET activo = ? WHERE idCupon = ?', [activo ? 1 : 0, id]);
    
    return sendSuccess(res, { message: 'Estado del cupón actualizado con éxito.' });
  } catch (error) {
    return handleError(res, error, 'Error al cambiar estado del cupón.', 'admin.toggleCouponStatus');
  }
};
