const pool = require('../config/db');

exports.getAllShippingMethods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT idTipoEntrega as id, nombre, costo FROM tipoentrega');
    
    res.json({
      success: true,
      data: rows.map(r => ({ 
        ...r, 
        costo: Number(r.costo),
        desc: r.nombre.toLowerCase().includes('tienda') ? 'Disponible en 24h' : 'Entrega a domicilio'
      }))
    });
  } catch (error) {
    console.error('Error al obtener métodos de envío:', error);
    res.status(500).json({
      success: false,
      message: 'No se pudieron cargar los métodos de envío.'
    });
  }
};
