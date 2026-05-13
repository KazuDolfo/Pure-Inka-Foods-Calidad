const pool = require('../config/db');
const { generateInvoice } = require('../utils/pdf-generator');

exports.getDashboardStats = async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 7;

    const [[{ totalRevenue }]] = await pool.query('SELECT SUM(totalPagar) as totalRevenue FROM pedido WHERE estado != "CANCELADO"');
    const [[{ pendingOrders }]] = await pool.query('SELECT COUNT(*) as pendingOrders FROM pedido WHERE estado = "PENDIENTE"');
    const [[{ totalProducts }]] = await pool.query('SELECT COUNT(*) as totalProducts FROM producto');
    const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM cliente');

    const [salesRaw] = await pool.query(`
      SELECT DATE_FORMAT(fecha, '%Y-%m-%d') as label, SUM(totalPagar) as data
      FROM pedido
      WHERE estado != 'CANCELADO' AND fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY label
      ORDER BY label ASC
    `, [period]);

    const [statusRaw] = await pool.query(`
      SELECT estado as label, COUNT(*) as data
      FROM pedido
      GROUP BY estado
    `);

    const [topProductsRaw] = await pool.query(`
      SELECT p.nombre as label, SUM(dp.cantidad) as data
      FROM detallepedido dp
      JOIN producto p ON dp.idProducto = p.idProducto
      JOIN pedido ped ON dp.idPedido = ped.idPedido
      WHERE ped.estado != 'CANCELADO' AND ped.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY p.idProducto
      ORDER BY data DESC
      LIMIT 5
    `, [period]);

    const [categoryRaw] = await pool.query(`
      SELECT c.nombre as label, SUM(dp.subtotal) as data
      FROM detallepedido dp
      JOIN producto p ON dp.idProducto = p.idProducto
      JOIN categoria c ON p.idCategoria = c.idCategoria
      JOIN pedido ped ON dp.idPedido = ped.idPedido
      WHERE ped.estado != 'CANCELADO' AND ped.fecha >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY c.idCategoria
    `, [period]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue || 0,
        pendingOrders: pendingOrders || 0,
        totalProducts: totalProducts || 0,
        totalUsers: totalUsers || 0,
        salesChart: {
          labels: salesRaw.map(r => r.label),
          data: salesRaw.map(r => r.data)
        },
        statusChart: {
          labels: statusRaw.map(r => r.label),
          data: statusRaw.map(r => r.data)
        },
        topProductsChart: {
          labels: topProductsRaw.map(r => r.label),
          data: topProductsRaw.map(r => r.data)
        },
        categoryChart: {
          labels: categoryRaw.map(r => r.label),
          data: categoryRaw.map(r => r.data)
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas.' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
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
    `);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ success: false, message: 'Error al obtener pedidos.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const validStatuses = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
    if (!validStatuses.includes(estado.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Estado no válido.' });
    }

    const nuevoEstado = estado.toUpperCase();
    await pool.query('UPDATE pedido SET estado = ? WHERE idPedido = ?', [nuevoEstado, id]);

    if (nuevoEstado === 'PAGADO') {
      try {
        const [[order]] = await pool.query('SELECT * FROM pedido WHERE idPedido = ?', [id]);
        const [details] = await pool.query(`
          SELECT dp.*, p.nombre as producto_nombre 
          FROM detallepedido dp 
          JOIN producto p ON dp.idProducto = p.idProducto 
          WHERE dp.idPedido = ?`, [id]);
        const [[customer]] = await pool.query('SELECT nombre, correo, telefono FROM cliente WHERE idCliente = ?', [order.idCliente]);

        const { fileName } = await generateInvoice(order, details, customer);

        const [pagos] = await pool.query('SELECT idPago FROM pago WHERE idPedido = ?', [id]);
        let idPago;
        
        if (pagos.length > 0) {
          idPago = pagos[0].idPago;
        } else {
          const [pagoRes] = await pool.query(
            'INSERT INTO pago (idPedido, idMetodoPago, monto, estado, referenciaExterna) VALUES (?, ?, ?, ?, ?)',
            [id, 1, order.totalPagar, 'COMPLETADO', 'ADMIN_MANUAL']
          );
          idPago = pagoRes.insertId;
        }

        await pool.query(
          'INSERT INTO comprobantepago (idPago, tipo, monto, rutaPDF) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rutaPDF = ?',
          [idPago, 'Boleta', order.totalPagar, `/uploads/invoices/${fileName}`, `/uploads/invoices/${fileName}`]
        );
        
        console.log(`✅ Boleta generada para pedido #${id}: ${fileName}`);
      } catch (pdfErr) {
        console.error('Error generando PDF de boleta:', pdfErr);
      }
    }

    res.json({ 
      success: true, 
      message: `Pedido #${id} actualizado a ${estado}.` 
    });
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar estado del pedido.' });
  }
};

exports.getMessages = async (req, res) => {
  
  res.json({ success: true, data: [] });
};

exports.getDistributorRequests = async (req, res) => {
  
  res.json({ success: true, data: [] });
};
