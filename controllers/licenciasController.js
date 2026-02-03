const db = require("../config/config");

const CATEGORIAS = ['windows', 'office', 'antivirus', 'adobe', 'otro'];

const LicenciasController = {
  /**
   * GET /licencias - Lista licencias con filtros
   */
  getLicencias: (req, res) => {
    const { activas, categoria } = req.query;

    let conditions = [];
    let params = [];

    if (activas === 'true') {
      conditions.push(`activa = 1`);
    } else if (activas === 'false') {
      conditions.push(`activa = 0`);
    }

    if (categoria && CATEGORIAS.includes(categoria)) {
      conditions.push(`categoria = ?`);
      params.push(categoria);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        id,
        nombre,
        categoria,
        descripcion,
        precio_venta,
        tiempo_instalacion_minutos,
        activa
      FROM licencias
      ${whereClause}
      ORDER BY categoria, nombre
    `;

    db.query(query, params, (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const data = result.map(l => ({
        id: l.id,
        nombre: l.nombre,
        categoria: l.categoria,
        descripcion: l.descripcion,
        precio_venta: parseFloat(l.precio_venta),
        tiempo_instalacion_minutos: l.tiempo_instalacion_minutos,
        activa: l.activa === 1
      }));

      res.status(200).json({ data });
    });
  },

  /**
   * GET /licencias/:id - Detalle de licencia
   */
  getLicencia: (req, res) => {
    const { id } = req.params;

    const query = `SELECT * FROM licencias WHERE id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Licencia no encontrada" });
      }

      const l = result[0];
      res.status(200).json({
        id: l.id,
        nombre: l.nombre,
        categoria: l.categoria,
        descripcion: l.descripcion,
        precio_costo: parseFloat(l.precio_costo),
        precio_venta: parseFloat(l.precio_venta),
        tiempo_instalacion_minutos: l.tiempo_instalacion_minutos,
        activa: l.activa === 1,
        created_at: l.created_at,
        updated_at: l.updated_at
      });
    });
  },

  /**
   * POST /licencias - Crear licencia
   */
  createLicencia: (req, res) => {
    const { 
      nombre, 
      categoria, 
      descripcion, 
      precio_costo = 0, 
      precio_venta, 
      tiempo_instalacion_minutos = 30,
      activa = true
    } = req.body;

    if (!nombre || !categoria || !precio_venta) {
      return res.status(400).json({ message: "Nombre, categoría y precio de venta son requeridos" });
    }

    if (!CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ message: `Categoría inválida. Categorías permitidas: ${CATEGORIAS.join(', ')}` });
    }

    const data = {
      nombre,
      categoria,
      descripcion,
      precio_costo,
      precio_venta,
      tiempo_instalacion_minutos,
      activa: activa ? 1 : 0
    };

    const query = `INSERT INTO licencias SET ?`;
    db.query(query, [data], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      res.status(201).json({
        message: "Licencia creada exitosamente",
        data: {
          id: result.insertId,
          ...data,
          activa: data.activa === 1
        }
      });
    });
  },

  /**
   * PUT /licencias/:id - Actualizar licencia
   */
  updateLicencia: (req, res) => {
    const { id } = req.params;
    const { 
      nombre, 
      categoria, 
      descripcion, 
      precio_costo, 
      precio_venta, 
      tiempo_instalacion_minutos,
      activa
    } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (precio_costo !== undefined) updateData.precio_costo = precio_costo;
    if (precio_venta !== undefined) updateData.precio_venta = precio_venta;
    if (tiempo_instalacion_minutos !== undefined) updateData.tiempo_instalacion_minutos = tiempo_instalacion_minutos;
    if (activa !== undefined) updateData.activa = activa ? 1 : 0;

    if (categoria !== undefined) {
      if (!CATEGORIAS.includes(categoria)) {
        return res.status(400).json({ message: `Categoría inválida. Categorías permitidas: ${CATEGORIAS.join(', ')}` });
      }
      updateData.categoria = categoria;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    const query = `UPDATE licencias SET ? WHERE id = ?`;
    db.query(query, [updateData, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Licencia no encontrada" });
      }

      res.status(200).json({ message: "Licencia actualizada exitosamente" });
    });
  },

  /**
   * PUT /licencias/:id/toggle - Activar/desactivar licencia
   */
  toggleLicencia: (req, res) => {
    const { id } = req.params;

    // Obtener estado actual
    const getQuery = `SELECT activa FROM licencias WHERE id = ?`;
    db.query(getQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Licencia no encontrada" });
      }

      const nuevoEstado = result[0].activa === 1 ? 0 : 1;

      const updateQuery = `UPDATE licencias SET activa = ? WHERE id = ?`;
      db.query(updateQuery, [nuevoEstado, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        res.status(200).json({
          message: nuevoEstado === 1 ? "Licencia activada" : "Licencia desactivada",
          activa: nuevoEstado === 1
        });
      });
    });
  },

  /**
   * DELETE /licencias/:id - Eliminar licencia
   */
  deleteLicencia: (req, res) => {
    const { id } = req.params;

    const query = `DELETE FROM licencias WHERE id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Licencia no encontrada" });
      }

      res.status(200).json({ message: "Licencia eliminada exitosamente" });
    });
  }
};

module.exports = LicenciasController;
