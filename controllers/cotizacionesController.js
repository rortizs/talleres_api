const db = require("../config/config");

const ESTADOS = ['borrador', 'enviada', 'aprobada', 'rechazada', 'vencida'];
const TIPOS_ITEM = ['necesario', 'recomendado', 'opcion'];

const CotizacionesController = {
  /**
   * GET /cotizaciones - Lista cotizaciones con filtros
   */
  getCotizaciones: (req, res) => {
    const { orden_id, estado, tecnico_id, perPage = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(perPage);

    let conditions = [];
    let params = [];

    if (orden_id) {
      conditions.push(`c.os_id = ?`);
      params.push(parseInt(orden_id));
    }

    if (estado) {
      const estados = estado.split(',');
      conditions.push(`c.estado IN (?)`);
      params.push(estados);
    }

    if (tecnico_id) {
      conditions.push(`c.tecnico_id = ?`);
      params.push(parseInt(tecnico_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM cotizaciones c ${whereClause}`;
    
    const dataQuery = `
      SELECT 
        c.*,
        o.numero_orden,
        o.descricaoProduto as equipo_descripcion,
        cl.nomeCliente as cliente_nombre,
        t.nome as tecnico_nombre
      FROM cotizaciones c
      LEFT JOIN os o ON c.os_id = o.idOs
      LEFT JOIN clientes cl ON o.clientes_id = cl.idClientes
      LEFT JOIN usuarios t ON c.tecnico_id = t.idUsuarios
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(countQuery, params, (err, countResult) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const total = countResult[0].total;

      db.query(dataQuery, [...params, parseInt(perPage), offset], (err, cotizaciones) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        const data = cotizaciones.map(c => ({
          id: c.id,
          numero_cotizacion: c.numero_cotizacion,
          estado: c.estado,
          fecha_emision: c.fecha_emision,
          fecha_vencimiento: c.fecha_vencimiento,
          total: parseFloat(c.total) || 0,
          orden: {
            id: c.os_id,
            numero_orden: c.numero_orden,
            equipo: c.equipo_descripcion
          },
          cliente: c.cliente_nombre,
          tecnico: c.tecnico_nombre
        }));

        res.status(200).json({
          data,
          meta: {
            current_page: parseInt(page),
            per_page: parseInt(perPage),
            total,
            last_page: Math.ceil(total / parseInt(perPage))
          }
        });
      });
    });
  },

  /**
   * GET /cotizaciones/:id - Detalle de cotización con items
   */
  getCotizacion: (req, res) => {
    const { id } = req.params;

    const query = `
      SELECT 
        c.*,
        o.numero_orden,
        o.descricaoProduto as equipo_descripcion,
        cl.idClientes as cliente_id,
        cl.nomeCliente as cliente_nombre,
        t.idUsuarios as tecnico_id,
        t.nome as tecnico_nombre
      FROM cotizaciones c
      LEFT JOIN os o ON c.os_id = o.idOs
      LEFT JOIN clientes cl ON o.clientes_id = cl.idClientes
      LEFT JOIN usuarios t ON c.tecnico_id = t.idUsuarios
      WHERE c.id = ?
    `;

    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      const c = result[0];

      // Obtener items
      const itemsQuery = `SELECT * FROM cotizacion_items WHERE cotizacion_id = ? ORDER BY tipo, id`;
      db.query(itemsQuery, [id], (err, items) => {
        if (err) items = [];

        // Agrupar items por tipo
        const itemsAgrupados = {
          necesarios: items.filter(i => i.tipo === 'necesario').map(formatItem),
          recomendados: items.filter(i => i.tipo === 'recomendado').map(formatItem),
          opciones: items.filter(i => i.tipo === 'opcion').map(formatItem)
        };

        res.status(200).json({
          id: c.id,
          numero_cotizacion: c.numero_cotizacion,
          estado: c.estado,
          fecha_emision: c.fecha_emision,
          fecha_vencimiento: c.fecha_vencimiento,
          orden: {
            id: c.os_id,
            numero_orden: c.numero_orden,
            cliente: {
              id: c.cliente_id,
              nombre: c.cliente_nombre
            }
          },
          tecnico: c.tecnico_id ? {
            id: c.tecnico_id,
            nombre: c.tecnico_nombre
          } : null,
          items: itemsAgrupados,
          subtotal_necesario: parseFloat(c.subtotal_necesario) || 0,
          subtotal_recomendado: parseFloat(c.subtotal_recomendado) || 0,
          subtotal_opciones: parseFloat(c.subtotal_opciones) || 0,
          descuento: parseFloat(c.descuento) || 0,
          total: parseFloat(c.total) || 0,
          porcentaje_anticipo: c.porcentaje_anticipo,
          monto_anticipo: parseFloat(c.monto_anticipo) || 0,
          notas_cliente: c.notas_cliente,
          aprobado_por: c.aprobado_por,
          fecha_aprobacion: c.fecha_aprobacion
        });
      });
    });
  },

  /**
   * POST /cotizaciones - Crear cotización
   */
  createCotizacion: (req, res) => {
    const { 
      orden_id, 
      tecnico_id, 
      items = [], 
      notas_cliente,
      porcentaje_anticipo = 60 
    } = req.body;

    if (!orden_id) {
      return res.status(400).json({ message: "orden_id es requerido" });
    }

    // Verificar que la orden existe
    db.query(`SELECT idOs FROM os WHERE idOs = ?`, [orden_id], (err, ordenResult) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!ordenResult || ordenResult.length === 0) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      // Generar número de cotización
      const now = new Date();
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      db.query(`SELECT COUNT(*) as count FROM cotizaciones WHERE numero_cotizacion LIKE ?`, [`${yearMonth}%`], (err, countResult) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        const cotNum = String((countResult[0].count || 0) + 1).padStart(2, '0');
        const numero_cotizacion = `${yearMonth}-${cotNum}`;

        // Calcular totales
        let subtotal_necesario = 0;
        let subtotal_recomendado = 0;
        let subtotal_opciones = 0;

        items.forEach(item => {
          const subtotal = (parseFloat(item.precio_venta) || 0) * (item.cantidad || 1);
          if (item.tipo === 'necesario') subtotal_necesario += subtotal;
          else if (item.tipo === 'recomendado') subtotal_recomendado += subtotal;
          else if (item.tipo === 'opcion') subtotal_opciones += subtotal;
        });

        const total = subtotal_necesario; // Solo necesarios por defecto
        const monto_anticipo = total * (porcentaje_anticipo / 100);

        const cotizacionData = {
          numero_cotizacion,
          os_id: orden_id,
          tecnico_id,
          estado: 'borrador',
          fecha_emision: now,
          fecha_vencimiento: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 días
          subtotal_necesario,
          subtotal_recomendado,
          subtotal_opciones,
          total,
          porcentaje_anticipo,
          monto_anticipo,
          notas_cliente
        };

        db.query(`INSERT INTO cotizaciones SET ?`, [cotizacionData], (err, result) => {
          if (err) return res.status(500).json({ message: "Error al crear cotización", error: err.message });

          const cotizacionId = result.insertId;

          // Insertar items si hay
          if (items.length > 0) {
            const itemsData = items.map(item => [
              cotizacionId,
              item.tipo,
              item.grupo_opcion || null,
              item.descripcion,
              item.detalle || null,
              item.precio_costo || 0,
              item.envio || 0,
              item.margen_codigo || null,
              item.precio_venta,
              item.cantidad || 1,
              (parseFloat(item.precio_venta) || 0) * (item.cantidad || 1)
            ]);

            const insertItemsQuery = `
              INSERT INTO cotizacion_items 
              (cotizacion_id, tipo, grupo_opcion, descripcion, detalle, precio_costo, envio, margen_codigo, precio_venta, cantidad, subtotal)
              VALUES ?
            `;

            db.query(insertItemsQuery, [itemsData], (err) => {
              if (err) console.error("Error insertando items:", err.message);
              
              res.status(201).json({
                message: "Cotización creada exitosamente",
                data: {
                  id: cotizacionId,
                  numero_cotizacion,
                  estado: 'borrador',
                  total
                }
              });
            });
          } else {
            res.status(201).json({
              message: "Cotización creada exitosamente",
              data: {
                id: cotizacionId,
                numero_cotizacion,
                estado: 'borrador',
                total
              }
            });
          }
        });
      });
    });
  },

  /**
   * PUT /cotizaciones/:id - Actualizar cotización
   */
  updateCotizacion: (req, res) => {
    const { id } = req.params;
    const { 
      estado,
      notas_cliente,
      porcentaje_anticipo,
      descuento
    } = req.body;

    // Verificar estado actual
    db.query(`SELECT estado, total FROM cotizaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      const cotizacion = result[0];

      // No permitir editar cotizaciones aprobadas
      if (cotizacion.estado === 'aprobada') {
        return res.status(400).json({ message: "No se puede editar una cotización aprobada" });
      }

      const updateData = {};
      if (estado && ESTADOS.includes(estado)) updateData.estado = estado;
      if (notas_cliente !== undefined) updateData.notas_cliente = notas_cliente;
      if (descuento !== undefined) updateData.descuento = descuento;
      
      if (porcentaje_anticipo !== undefined) {
        updateData.porcentaje_anticipo = porcentaje_anticipo;
        updateData.monto_anticipo = parseFloat(cotizacion.total) * (porcentaje_anticipo / 100);
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No hay datos para actualizar" });
      }

      db.query(`UPDATE cotizaciones SET ? WHERE id = ?`, [updateData, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        res.status(200).json({ message: "Cotización actualizada exitosamente" });
      });
    });
  },

  /**
   * POST /cotizaciones/:id/items - Agregar item
   */
  addItem: (req, res) => {
    const { id } = req.params;
    const { 
      tipo, 
      descripcion, 
      detalle,
      precio_costo = 0,
      envio = 0,
      margen_codigo,
      precio_venta,
      cantidad = 1,
      grupo_opcion
    } = req.body;

    if (!tipo || !descripcion || !precio_venta) {
      return res.status(400).json({ message: "tipo, descripcion y precio_venta son requeridos" });
    }

    if (!TIPOS_ITEM.includes(tipo)) {
      return res.status(400).json({ message: `Tipo inválido. Tipos permitidos: ${TIPOS_ITEM.join(', ')}` });
    }

    // Verificar cotización existe y no está aprobada
    db.query(`SELECT estado FROM cotizaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }
      if (result[0].estado === 'aprobada') {
        return res.status(400).json({ message: "No se puede modificar una cotización aprobada" });
      }

      const subtotal = parseFloat(precio_venta) * cantidad;

      const itemData = {
        cotizacion_id: id,
        tipo,
        grupo_opcion,
        descripcion,
        detalle,
        precio_costo,
        envio,
        margen_codigo,
        precio_venta,
        cantidad,
        subtotal
      };

      db.query(`INSERT INTO cotizacion_items SET ?`, [itemData], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        // Recalcular totales
        recalcularTotales(id, (err) => {
          if (err) console.error("Error recalculando totales:", err.message);

          res.status(201).json({
            message: "Item agregado exitosamente",
            data: {
              id: result.insertId,
              ...itemData
            }
          });
        });
      });
    });
  },

  /**
   * PUT /cotizaciones/:id/items/:itemId - Actualizar item
   */
  updateItem: (req, res) => {
    const { id, itemId } = req.params;
    const { 
      descripcion, 
      detalle,
      precio_costo,
      envio,
      margen_codigo,
      precio_venta,
      cantidad
    } = req.body;

    // Verificar cotización no aprobada
    db.query(`SELECT estado FROM cotizaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }
      if (result[0].estado === 'aprobada') {
        return res.status(400).json({ message: "No se puede modificar una cotización aprobada" });
      }

      const updateData = {};
      if (descripcion !== undefined) updateData.descripcion = descripcion;
      if (detalle !== undefined) updateData.detalle = detalle;
      if (precio_costo !== undefined) updateData.precio_costo = precio_costo;
      if (envio !== undefined) updateData.envio = envio;
      if (margen_codigo !== undefined) updateData.margen_codigo = margen_codigo;
      if (precio_venta !== undefined) updateData.precio_venta = precio_venta;
      if (cantidad !== undefined) updateData.cantidad = cantidad;

      // Recalcular subtotal si cambió precio o cantidad
      if (precio_venta !== undefined || cantidad !== undefined) {
        db.query(`SELECT precio_venta, cantidad FROM cotizacion_items WHERE id = ?`, [itemId], (err, itemResult) => {
          if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
          
          const currentItem = itemResult[0] || {};
          const newPrecio = precio_venta !== undefined ? precio_venta : currentItem.precio_venta;
          const newCantidad = cantidad !== undefined ? cantidad : currentItem.cantidad;
          updateData.subtotal = parseFloat(newPrecio) * newCantidad;

          executeUpdate();
        });
      } else {
        executeUpdate();
      }

      function executeUpdate() {
        if (Object.keys(updateData).length === 0) {
          return res.status(400).json({ message: "No hay datos para actualizar" });
        }

        db.query(`UPDATE cotizacion_items SET ? WHERE id = ? AND cotizacion_id = ?`, [updateData, itemId, id], (err, result) => {
          if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
          if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Item no encontrado" });
          }

          recalcularTotales(id, (err) => {
            if (err) console.error("Error recalculando totales:", err.message);

            res.status(200).json({ message: "Item actualizado exitosamente" });
          });
        });
      }
    });
  },

  /**
   * DELETE /cotizaciones/:id/items/:itemId - Eliminar item
   */
  deleteItem: (req, res) => {
    const { id, itemId } = req.params;

    // Verificar cotización no aprobada
    db.query(`SELECT estado FROM cotizaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }
      if (result[0].estado === 'aprobada') {
        return res.status(400).json({ message: "No se puede modificar una cotización aprobada" });
      }

      db.query(`DELETE FROM cotizacion_items WHERE id = ? AND cotizacion_id = ?`, [itemId, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Item no encontrado" });
        }

        recalcularTotales(id, (err) => {
          if (err) console.error("Error recalculando totales:", err.message);

          res.status(200).json({ message: "Item eliminado exitosamente" });
        });
      });
    });
  },

  /**
   * PUT /cotizaciones/:id/aprobar - Aprobar cotización
   */
  aprobarCotizacion: (req, res) => {
    const { id } = req.params;
    const { aprobado_por, items_seleccionados = [] } = req.body;

    if (!aprobado_por) {
      return res.status(400).json({ message: "aprobado_por es requerido" });
    }

    db.query(`SELECT * FROM cotizaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      const cotizacion = result[0];

      if (cotizacion.estado !== 'enviada') {
        return res.status(400).json({ message: "Solo se pueden aprobar cotizaciones en estado 'enviada'" });
      }

      // Marcar items seleccionados
      if (items_seleccionados.length > 0) {
        db.query(`UPDATE cotizacion_items SET seleccionado = 1 WHERE id IN (?) AND cotizacion_id = ?`, 
          [items_seleccionados, id], (err) => {
            if (err) console.error("Error marcando items:", err.message);
          }
        );
      }

      // Actualizar cotización
      const updateData = {
        estado: 'aprobada',
        aprobado_por,
        fecha_aprobacion: new Date()
      };

      db.query(`UPDATE cotizaciones SET ? WHERE id = ?`, [updateData, id], (err) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        // Actualizar orden con el total aprobado
        db.query(`UPDATE os SET valorTotal = ?, anticipo = ? WHERE idOs = ?`, 
          [cotizacion.total, cotizacion.monto_anticipo, cotizacion.os_id], (err) => {
            if (err) console.error("Error actualizando orden:", err.message);

            res.status(200).json({
              message: "Cotización aprobada exitosamente",
              data: {
                total_aprobado: parseFloat(cotizacion.total),
                monto_anticipo: parseFloat(cotizacion.monto_anticipo)
              }
            });
          }
        );
      });
    });
  },

  /**
   * PUT /cotizaciones/:id/enviar - Cambiar a estado enviada
   */
  enviarCotizacion: (req, res) => {
    const { id } = req.params;

    db.query(`SELECT estado FROM cotizaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Cotización no encontrada" });
      }

      if (result[0].estado !== 'borrador') {
        return res.status(400).json({ message: "Solo se pueden enviar cotizaciones en estado 'borrador'" });
      }

      db.query(`UPDATE cotizaciones SET estado = 'enviada', fecha_emision = ? WHERE id = ?`, [new Date(), id], (err) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        res.status(200).json({ message: "Cotización enviada exitosamente" });
      });
    });
  }
};

// Helper: Formatear item para respuesta
function formatItem(item) {
  return {
    id: item.id,
    descripcion: item.descripcion,
    detalle: item.detalle,
    precio_costo: parseFloat(item.precio_costo) || 0,
    envio: parseFloat(item.envio) || 0,
    margen_codigo: item.margen_codigo,
    precio_venta: parseFloat(item.precio_venta) || 0,
    cantidad: item.cantidad,
    subtotal: parseFloat(item.subtotal) || 0,
    grupo_opcion: item.grupo_opcion,
    seleccionado: item.seleccionado === 1
  };
}

// Helper: Recalcular totales de cotización
function recalcularTotales(cotizacionId, callback) {
  const query = `
    SELECT tipo, SUM(subtotal) as total 
    FROM cotizacion_items 
    WHERE cotizacion_id = ? 
    GROUP BY tipo
  `;

  db.query(query, [cotizacionId], (err, result) => {
    if (err) return callback(err);

    let subtotal_necesario = 0;
    let subtotal_recomendado = 0;
    let subtotal_opciones = 0;

    result.forEach(row => {
      if (row.tipo === 'necesario') subtotal_necesario = parseFloat(row.total) || 0;
      else if (row.tipo === 'recomendado') subtotal_recomendado = parseFloat(row.total) || 0;
      else if (row.tipo === 'opcion') subtotal_opciones = parseFloat(row.total) || 0;
    });

    const total = subtotal_necesario;

    // Obtener porcentaje_anticipo actual
    db.query(`SELECT porcentaje_anticipo FROM cotizaciones WHERE id = ?`, [cotizacionId], (err, cotResult) => {
      if (err) return callback(err);

      const porcentaje = cotResult[0]?.porcentaje_anticipo || 60;
      const monto_anticipo = total * (porcentaje / 100);

      const updateData = {
        subtotal_necesario,
        subtotal_recomendado,
        subtotal_opciones,
        total,
        monto_anticipo
      };

      db.query(`UPDATE cotizaciones SET ? WHERE id = ?`, [updateData, cotizacionId], callback);
    });
  });
}

module.exports = CotizacionesController;
