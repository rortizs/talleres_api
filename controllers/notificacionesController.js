const db = require("../config/config");

const TIPOS_NOTIFICACION = [
  'orden_recibida',
  'orden_diagnostico',
  'cotizacion_enviada',
  'cotizacion_aprobada',
  'orden_en_proceso',
  'orden_lista',
  'orden_entregada',
  'recordatorio_retiro'
];

const NotificacionesController = {
  /**
   * GET /notificaciones - Lista notificaciones
   */
  getNotificaciones: (req, res) => {
    const { estado, tipo, orden_id, perPage = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(perPage);

    let conditions = [];
    let params = [];

    if (estado) {
      conditions.push(`n.estado = ?`);
      params.push(estado);
    }

    if (tipo) {
      conditions.push(`n.tipo = ?`);
      params.push(tipo);
    }

    if (orden_id) {
      conditions.push(`n.os_id = ?`);
      params.push(parseInt(orden_id));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM notificaciones n ${whereClause}`;

    const dataQuery = `
      SELECT 
        n.*,
        o.numero_orden,
        c.nomeCliente as cliente_nombre
      FROM notificaciones n
      LEFT JOIN os o ON n.os_id = o.idOs
      LEFT JOIN clientes c ON o.clientes_id = c.idClientes
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(countQuery, params, (err, countResult) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const total = countResult[0].total;

      db.query(dataQuery, [...params, parseInt(perPage), offset], (err, notificaciones) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        const data = notificaciones.map(n => ({
          id: n.id,
          tipo: n.tipo,
          telefono: n.telefono,
          mensaje: n.mensaje,
          estado: n.estado,
          intentos: n.intentos,
          fecha_envio: n.fecha_envio,
          error_mensaje: n.error_mensaje,
          orden: n.os_id ? {
            id: n.os_id,
            numero_orden: n.numero_orden,
            cliente: n.cliente_nombre
          } : null,
          created_at: n.created_at
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
   * POST /notificaciones/enviar - Crear y enviar notificación
   */
  enviarNotificacion: (req, res) => {
    const { tipo, orden_id, telefono, mensaje } = req.body;

    if (!tipo || !mensaje) {
      return res.status(400).json({ message: "tipo y mensaje son requeridos" });
    }

    if (!TIPOS_NOTIFICACION.includes(tipo)) {
      return res.status(400).json({ message: `Tipo inválido. Tipos permitidos: ${TIPOS_NOTIFICACION.join(', ')}` });
    }

    let telefonoFinal = telefono;

    // Si no viene teléfono, obtenerlo de la orden
    const insertNotificacion = (tel) => {
      const data = {
        tipo,
        os_id: orden_id || null,
        telefono: tel,
        mensaje,
        estado: 'pendiente',
        intentos: 0
      };

      db.query(`INSERT INTO notificaciones SET ?`, [data], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        // Aquí se integraría con WhatsApp Business API
        // Por ahora solo registramos la notificación como pendiente
        
        // Simular envío exitoso después de 1 segundo
        setTimeout(() => {
          db.query(`UPDATE notificaciones SET estado = 'enviada', fecha_envio = ?, intentos = 1 WHERE id = ?`, 
            [new Date(), result.insertId], (err) => {
              if (err) console.error("Error actualizando notificación:", err.message);
            }
          );
        }, 1000);

        res.status(201).json({
          message: "Notificación creada",
          data: {
            id: result.insertId,
            tipo,
            telefono: tel,
            estado: 'pendiente',
            nota: "La notificación será procesada. Integración con WhatsApp pendiente."
          }
        });
      });
    };

    if (!telefonoFinal && orden_id) {
      // Obtener teléfono del cliente de la orden
      const query = `
        SELECT c.celular 
        FROM os o 
        JOIN clientes c ON o.clientes_id = c.idClientes 
        WHERE o.idOs = ?
      `;
      db.query(query, [orden_id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
        if (!result || result.length === 0 || !result[0].celular) {
          return res.status(400).json({ message: "No se encontró teléfono para la orden" });
        }
        insertNotificacion(result[0].celular);
      });
    } else if (telefonoFinal) {
      insertNotificacion(telefonoFinal);
    } else {
      return res.status(400).json({ message: "Se requiere telefono u orden_id" });
    }
  },

  /**
   * POST /notificaciones/:id/reenviar - Reenviar notificación fallida
   */
  reenviarNotificacion: (req, res) => {
    const { id } = req.params;

    db.query(`SELECT * FROM notificaciones WHERE id = ?`, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }

      const notif = result[0];

      if (notif.estado === 'enviada') {
        return res.status(400).json({ message: "La notificación ya fue enviada" });
      }

      // Incrementar intentos
      db.query(`UPDATE notificaciones SET intentos = intentos + 1, estado = 'pendiente', error_mensaje = NULL WHERE id = ?`, [id], (err) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        // Simular envío
        setTimeout(() => {
          db.query(`UPDATE notificaciones SET estado = 'enviada', fecha_envio = ? WHERE id = ?`, 
            [new Date(), id], (err) => {
              if (err) console.error("Error actualizando notificación:", err.message);
            }
          );
        }, 1000);

        res.status(200).json({
          message: "Reenvío programado",
          intentos: notif.intentos + 1
        });
      });
    });
  },

  /**
   * GET /notificaciones/pendientes - Obtener notificaciones pendientes (para procesador)
   */
  getPendientes: (req, res) => {
    const query = `
      SELECT 
        n.*,
        o.numero_orden,
        c.nomeCliente as cliente_nombre
      FROM notificaciones n
      LEFT JOIN os o ON n.os_id = o.idOs
      LEFT JOIN clientes c ON o.clientes_id = c.idClientes
      WHERE n.estado = 'pendiente'
      ORDER BY n.created_at ASC
      LIMIT 50
    `;

    db.query(query, (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      res.status(200).json({
        total: result.length,
        data: result.map(n => ({
          id: n.id,
          tipo: n.tipo,
          telefono: n.telefono,
          mensaje: n.mensaje,
          orden_id: n.os_id,
          numero_orden: n.numero_orden,
          cliente: n.cliente_nombre,
          intentos: n.intentos
        }))
      });
    });
  },

  /**
   * PUT /notificaciones/:id/marcar-enviada - Marcar como enviada (para procesador externo)
   */
  marcarEnviada: (req, res) => {
    const { id } = req.params;
    const { exito = true, error_mensaje } = req.body;

    const updateData = {
      fecha_envio: new Date(),
      estado: exito ? 'enviada' : 'fallida'
    };

    if (error_mensaje) {
      updateData.error_mensaje = error_mensaje;
    }

    db.query(`UPDATE notificaciones SET ? WHERE id = ?`, [updateData, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Notificación no encontrada" });
      }

      res.status(200).json({ message: exito ? "Marcada como enviada" : "Marcada como fallida" });
    });
  },

  /**
   * Generar mensaje automático basado en tipo y orden
   */
  generarMensaje: (req, res) => {
    const { tipo, orden_id } = req.body;

    if (!tipo || !orden_id) {
      return res.status(400).json({ message: "tipo y orden_id son requeridos" });
    }

    const query = `
      SELECT 
        o.*,
        c.nomeCliente as cliente_nombre,
        c.celular as cliente_telefono
      FROM os o
      JOIN clientes c ON o.clientes_id = c.idClientes
      WHERE o.idOs = ?
    `;

    db.query(query, [orden_id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      const orden = result[0];
      let mensaje = '';

      switch (tipo) {
        case 'orden_recibida':
          mensaje = `Hola ${orden.cliente_nombre}! Tu equipo (${orden.descricaoProduto}) ha sido recibido. Número de orden: ${orden.numero_orden}. Te notificaremos cuando tengamos el diagnóstico.`;
          break;
        case 'orden_diagnostico':
          mensaje = `Hola ${orden.cliente_nombre}! Ya tenemos el diagnóstico de tu equipo (${orden.descricaoProduto}). ${orden.diagnostico || 'Contáctanos para más detalles.'}`;
          break;
        case 'cotizacion_enviada':
          mensaje = `Hola ${orden.cliente_nombre}! Te enviamos la cotización para tu equipo (${orden.descricaoProduto}). Orden: ${orden.numero_orden}. Total: Q${orden.valorTotal || 0}`;
          break;
        case 'orden_lista':
          mensaje = `Hola ${orden.cliente_nombre}! Tu equipo (${orden.descricaoProduto}) está listo para retirar. Saldo pendiente: Q${(parseFloat(orden.valorTotal) - parseFloat(orden.anticipo || 0)).toFixed(2)}. Orden: ${orden.numero_orden}`;
          break;
        case 'recordatorio_retiro':
          mensaje = `Hola ${orden.cliente_nombre}! Te recordamos que tu equipo (${orden.descricaoProduto}) está listo para retirar en Digicom Taller. Orden: ${orden.numero_orden}`;
          break;
        default:
          mensaje = `Notificación de Digicom Taller. Orden: ${orden.numero_orden}`;
      }

      res.status(200).json({
        tipo,
        mensaje,
        telefono: orden.cliente_telefono,
        orden: {
          id: orden.idOs,
          numero_orden: orden.numero_orden,
          cliente: orden.cliente_nombre
        }
      });
    });
  }
};

module.exports = NotificacionesController;
