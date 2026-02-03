const db = require("../config/config");

const PreciosController = {
  /**
   * GET /configuracion/precios - Lista márgenes configurados
   */
  getPrecios: (req, res) => {
    const query = `
      SELECT id, nombre, codigo, tipo, valor, es_default, activo
      FROM configuracion_precios
      WHERE activo = 1
      ORDER BY valor ASC
    `;

    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const data = result.map(p => ({
        id: p.id,
        nombre: p.nombre,
        codigo: p.codigo,
        tipo: p.tipo,
        valor: parseFloat(p.valor),
        es_default: p.es_default === 1
      }));

      res.status(200).json({ data });
    });
  },

  /**
   * POST /configuracion/precios/calcular - Calcular precio de venta
   */
  calcularPrecio: (req, res) => {
    const { precio_costo, envio = 0, margen_codigo } = req.body;

    if (precio_costo === undefined || !margen_codigo) {
      return res.status(400).json({ message: "precio_costo y margen_codigo son requeridos" });
    }

    // Obtener margen
    db.query(`SELECT * FROM configuracion_precios WHERE codigo = ? AND activo = 1`, [margen_codigo], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Margen no encontrado" });
      }

      const margen = result[0];
      const costoTotal = parseFloat(precio_costo) + parseFloat(envio);
      let precioVenta, ganancia;

      if (margen.tipo === 'porcentaje') {
        // Fórmula: precio_venta = costo_total / (1 - margen)
        // Esto asegura que el margen sea sobre el precio de venta, no sobre el costo
        const margenDecimal = parseFloat(margen.valor);
        if (margenDecimal >= 1) {
          return res.status(400).json({ message: "El margen no puede ser 100% o mayor" });
        }
        precioVenta = costoTotal / (1 - margenDecimal);
        ganancia = precioVenta - costoTotal;
      } else {
        // Margen fijo
        ganancia = parseFloat(margen.valor);
        precioVenta = costoTotal + ganancia;
      }

      // Redondear a 2 decimales
      precioVenta = Math.round(precioVenta * 100) / 100;
      ganancia = Math.round(ganancia * 100) / 100;

      res.status(200).json({
        precio_costo: parseFloat(precio_costo),
        envio: parseFloat(envio),
        costo_total: costoTotal,
        margen_porcentaje: margen.tipo === 'porcentaje' ? parseFloat(margen.valor) * 100 : null,
        precio_venta: precioVenta,
        ganancia
      });
    });
  },

  /**
   * POST /configuracion/precios/calcular-todos - Calcular todos los márgenes
   */
  calcularTodos: (req, res) => {
    const { precio_costo, envio = 0 } = req.body;

    if (precio_costo === undefined) {
      return res.status(400).json({ message: "precio_costo es requerido" });
    }

    const costoTotal = parseFloat(precio_costo) + parseFloat(envio);

    db.query(`SELECT * FROM configuracion_precios WHERE activo = 1 ORDER BY valor DESC`, (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const sugerencias = result.map(margen => {
        let precioVenta, ganancia;

        if (margen.tipo === 'porcentaje') {
          const margenDecimal = parseFloat(margen.valor);
          if (margenDecimal >= 1) {
            precioVenta = costoTotal * 2; // Fallback para margen >= 100%
          } else {
            precioVenta = costoTotal / (1 - margenDecimal);
          }
          ganancia = precioVenta - costoTotal;
        } else {
          ganancia = parseFloat(margen.valor);
          precioVenta = costoTotal + ganancia;
        }

        return {
          codigo: margen.codigo,
          nombre: margen.nombre,
          precio_venta: Math.round(precioVenta * 100) / 100,
          ganancia: Math.round(ganancia * 100) / 100,
          es_default: margen.es_default === 1
        };
      });

      res.status(200).json({
        costo_total: costoTotal,
        sugerencias
      });
    });
  },

  /**
   * POST /configuracion/precios - Crear nuevo margen
   */
  createMargen: (req, res) => {
    const { nombre, codigo, tipo = 'porcentaje', valor, es_default = false } = req.body;

    if (!nombre || !codigo || valor === undefined) {
      return res.status(400).json({ message: "nombre, codigo y valor son requeridos" });
    }

    // Verificar código único
    db.query(`SELECT id FROM configuracion_precios WHERE codigo = ?`, [codigo], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result && result.length > 0) {
        return res.status(400).json({ message: "Ya existe un margen con ese código" });
      }

      // Si es default, quitar default de otros
      if (es_default) {
        db.query(`UPDATE configuracion_precios SET es_default = 0`, (err) => {
          if (err) console.error("Error quitando default:", err.message);
        });
      }

      const data = {
        nombre,
        codigo,
        tipo,
        valor,
        es_default: es_default ? 1 : 0,
        activo: 1
      };

      db.query(`INSERT INTO configuracion_precios SET ?`, [data], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        res.status(201).json({
          message: "Margen creado exitosamente",
          data: {
            id: result.insertId,
            ...data,
            es_default: data.es_default === 1
          }
        });
      });
    });
  },

  /**
   * PUT /configuracion/precios/:id - Actualizar margen
   */
  updateMargen: (req, res) => {
    const { id } = req.params;
    const { nombre, valor, es_default, activo } = req.body;

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (valor !== undefined) updateData.valor = valor;
    if (activo !== undefined) updateData.activo = activo ? 1 : 0;

    if (es_default === true) {
      // Quitar default de otros
      db.query(`UPDATE configuracion_precios SET es_default = 0`, (err) => {
        if (err) console.error("Error quitando default:", err.message);
      });
      updateData.es_default = 1;
    } else if (es_default === false) {
      updateData.es_default = 0;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    db.query(`UPDATE configuracion_precios SET ? WHERE id = ?`, [updateData, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Margen no encontrado" });
      }

      res.status(200).json({ message: "Margen actualizado exitosamente" });
    });
  },

  /**
   * DELETE /configuracion/precios/:id - Eliminar margen (soft delete)
   */
  deleteMargen: (req, res) => {
    const { id } = req.params;

    db.query(`UPDATE configuracion_precios SET activo = 0 WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Margen no encontrado" });
      }

      res.status(200).json({ message: "Margen eliminado exitosamente" });
    });
  }
};

module.exports = PreciosController;
