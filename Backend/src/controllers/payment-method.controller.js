const pool = require('../config/db');


exports.getAllMethods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT *, idMetodoPago as id_metodo FROM MetodoPago');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métodos' });
  }
};


exports.getActiveMethods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT *, idMetodoPago as id_metodo FROM MetodoPago WHERE activo = 1');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener métodos activos' });
  }
};


exports.createMethod = async (req, res) => {
  try {
    const { nombre, descripcion, instrucciones, activo } = req.body;
    const imagen_qr = req.file ? req.file.filename : null;
    const [result] = await pool.query(
      'INSERT INTO MetodoPago (nombre, descripcion, instrucciones, activo, imagen_qr) VALUES (?, ?, ?, ?, ?)',
      [nombre, descripcion, instrucciones, activo ? 1 : 0, imagen_qr]
    );
    res.status(201).json({ success: true, data: { id_metodo: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear método' });
  }
};


exports.updateMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, instrucciones, activo } = req.body;
    const imagen_qr = req.file ? req.file.filename : null;

    let query = 'UPDATE MetodoPago SET nombre = ?, descripcion = ?, instrucciones = ?, activo = ?';
    const params = [nombre, descripcion, instrucciones, activo ? 1 : 0];

    if (imagen_qr) {
      query += ', imagen_qr = ?';
      params.push(imagen_qr);
    }

    query += ' WHERE idMetodoPago = ?';
    params.push(id);

    await pool.query(query, params);
    res.json({ success: true, message: 'Método actualizado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar método' });
  }
};


exports.deleteMethod = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM MetodoPago WHERE idMetodoPago = ?', [id]);
    res.json({ success: true, message: 'Método eliminado' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar método' });
  }
};
