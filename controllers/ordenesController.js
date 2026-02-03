const db = require("../config/config");

// Estados válidos y transiciones permitidas
const ESTADOS = ['Aberto', 'Em Andamento', 'Aguardando Peças', 'Finalizado', 'Cancelado', 'Entregue'];

// Función auxiliar para registrar historial
const registrarHistorial = (ordenId, usuarioId, usuarioNombre, accion, estadoAnterior, estadoNuevo, descripcion, datosAdicionales = null) => {
  const historialData = {
    orden_id: ordenId,
    usuario_id: usuarioId || null,
    usuario_nombre: usuarioNombre || 'Sistema',
    accion,
    estado_anterior: estadoAnterior || null,
    estado_nuevo: estadoNuevo || null,
    descripcion: descripcion || null,
    datos_adicionales: datosAdicionales ? JSON.stringify(datosAdicionales) : null
  };

  db.query('INSERT INTO orden_historial SET ?', [historialData], (err) => {
    if (err) console.error('Error al registrar historial:', err.message);
  });
};
const TRANSICIONES = {
  'Aberto': ['Em Andamento', 'Cancelado'],
  'Em Andamento': ['Aguardando Peças', 'Finalizado', 'Cancelado'],
  'Aguardando Peças': ['Em Andamento', 'Cancelado'],
  'Finalizado': ['Entregue', 'Cancelado'],
  'Cancelado': [],
  'Entregue': []
};

const OrdenesController = {
  /**
   * GET /ordenes - Lista órdenes con filtros y paginación
   */
  getOrdenes: (req, res) => {
    const { 
      estado, 
      tecnico_id, 
      cliente_id, 
      search, 
      fecha_desde, 
      fecha_hasta,
      perPage = 20, 
      page = 1 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(perPage);
    let conditions = [];
    let params = [];

    // Filtros
    if (estado) {
      const estados = estado.split(',');
      conditions.push(`o.status IN (?)`);
      params.push(estados);
    }

    if (tecnico_id) {
      conditions.push(`o.tecnico_id = ?`);
      params.push(parseInt(tecnico_id));
    }

    if (cliente_id) {
      conditions.push(`o.clientes_id = ?`);
      params.push(parseInt(cliente_id));
    }

    if (search) {
      conditions.push(`(o.numero_orden LIKE ? OR c.nomeCliente LIKE ? OR o.descricaoProduto LIKE ?)`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (fecha_desde) {
      conditions.push(`DATE(o.dataInicial) >= ?`);
      params.push(fecha_desde);
    }

    if (fecha_hasta) {
      conditions.push(`DATE(o.dataInicial) <= ?`);
      params.push(fecha_hasta);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM os o 
      LEFT JOIN clientes c ON o.clientes_id = c.idClientes
      ${whereClause}
    `;

    // Query principal
    const dataQuery = `
      SELECT 
        o.idOs as id,
        o.numero_orden,
        o.status as estado,
        o.prioridad,
        o.dataInicial as fecha_ingreso,
        o.dataEntregaEstimada as fecha_entrega_estimada,
        DATEDIFF(CURDATE(), o.dataInicial) as dias_en_taller,
        o.valorTotal as total_cotizado,
        o.valorTotal - o.anticipo as saldo_pendiente,
        c.idClientes as cliente_id,
        c.nomeCliente as cliente_nombre,
        c.celular as cliente_telefono,
        t.idUsuarios as tecnico_id,
        t.nome as tecnico_nombre,
        o.tipo_equipo,
        o.marca,
        o.modelo,
        o.defeito as problema_reportado
      FROM os o
      LEFT JOIN clientes c ON o.clientes_id = c.idClientes
      LEFT JOIN usuarios t ON o.tecnico_id = t.idUsuarios
      ${whereClause}
      ORDER BY o.dataInicial DESC
      LIMIT ? OFFSET ?
    `;

    // Ejecutar count
    db.query(countQuery, params, (err, countResult) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / parseInt(perPage));

      // Ejecutar data query
      db.query(dataQuery, [...params, parseInt(perPage), offset], (err, ordenes) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        // Formatear respuesta
        const data = ordenes.map(o => ({
          id: o.id,
          numero_orden: o.numero_orden,
          estado: o.estado,
          prioridad: o.prioridad,
          fecha_ingreso: o.fecha_ingreso,
          fecha_entrega_estimada: o.fecha_entrega_estimada,
          dias_en_taller: o.dias_en_taller,
          total_cotizado: parseFloat(o.total_cotizado) || 0,
          saldo_pendiente: parseFloat(o.saldo_pendiente) || 0,
          cliente: {
            id: o.cliente_id,
            nombre: o.cliente_nombre,
            telefono: o.cliente_telefono
          },
          tecnico: o.tecnico_id ? {
            id: o.tecnico_id,
            nombre: o.tecnico_nombre
          } : null,
          equipo: {
            tipo: o.tipo_equipo,
            marca: o.marca,
            modelo: o.modelo,
            problema_reportado: o.problema_reportado
          }
        }));

        res.status(200).json({
          data,
          meta: {
            current_page: parseInt(page),
            per_page: parseInt(perPage),
            total,
            last_page: totalPages
          }
        });
      });
    });
  },

  /**
   * GET /ordenes/:id - Detalle completo de una orden
   */
  getOrden: (req, res) => {
    const { id } = req.params;

    const query = `
      SELECT 
        o.*,
        c.idClientes as cliente_id,
        c.nomeCliente as cliente_nombre,
        c.celular as cliente_telefono,
        c.email as cliente_email,
        t.idUsuarios as tecnico_id,
        t.nome as tecnico_nombre,
        r.idUsuarios as recepcionista_id,
        r.nome as recepcionista_nombre
      FROM os o
      LEFT JOIN clientes c ON o.clientes_id = c.idClientes
      LEFT JOIN usuarios t ON o.tecnico_id = t.idUsuarios
      LEFT JOIN usuarios r ON o.usuarios_id = r.idUsuarios
      WHERE o.idOs = ?
    `;

    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      const o = result[0];

      // Obtener servicios
      const serviciosQuery = `SELECT * FROM servicos_os WHERE os_id = ?`;
      db.query(serviciosQuery, [id], (err, servicios) => {
        if (err) servicios = [];

        // Obtener productos
        const productosQuery = `SELECT * FROM produtos_os WHERE os_id = ?`;
        db.query(productosQuery, [id], (err, productos) => {
          if (err) productos = [];

          const orden = {
            id: o.idOs,
            numero_orden: o.numero_orden,
            estado: o.status,
            prioridad: o.prioridad,
            fecha_ingreso: o.dataInicial,
            fecha_entrega_estimada: o.dataEntregaEstimada,
            notas_recepcion: o.observacoes,
            notas_internas: o.laudoTecnico,
            total_cotizado: parseFloat(o.valorTotal) || 0,
            anticipo: parseFloat(o.anticipo) || 0,
            saldo_pendiente: (parseFloat(o.valorTotal) || 0) - (parseFloat(o.anticipo) || 0),
            cliente: {
              id: o.cliente_id,
              nombre: o.cliente_nombre,
              telefono: o.cliente_telefono,
              email: o.cliente_email
            },
            tecnico: o.tecnico_id ? {
              id: o.tecnico_id,
              nombre: o.tecnico_nombre
            } : null,
            recepcionista: o.recepcionista_id ? {
              id: o.recepcionista_id,
              nombre: o.recepcionista_nombre
            } : null,
            equipo: {
              tipo_equipo: o.tipo_equipo,
              marca: o.marca,
              modelo: o.modelo,
              serial: o.serial,
              color: o.color,
              problema_reportado: o.defeito,
              tiene_dano_fisico: o.tiene_dano_fisico === 1,
              descripcion_dano_fisico: o.descripcion_dano_fisico,
              diagnostico: o.diagnostico,
              solucion_aplicada: o.solucion_aplicada
            },
            servicios: servicios || [],
            productos: productos || []
          };

          res.status(200).json(orden);
        });
      });
    });
  },

  /**
   * POST /ordenes - Crear nueva orden
   */
  createOrden: (req, res) => {
    const { 
      cliente, 
      equipo, 
      recepcionista_id, 
      notas_recepcion,
      prioridad = 'normal'
    } = req.body;

    if (!cliente || !equipo) {
      return res.status(400).json({ message: "Cliente y equipo son requeridos" });
    }

    // Generar número de orden: YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const countQuery = `SELECT COUNT(*) as count FROM os WHERE numero_orden LIKE ?`;
    db.query(countQuery, [`${yearMonth}%`], (err, countResult) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const orderNum = String((countResult[0].count || 0) + 1).padStart(4, '0');
      const numero_orden = `${yearMonth}-${orderNum}`;

      // Buscar o crear cliente
      const findClienteQuery = `SELECT idClientes FROM clientes WHERE celular = ? OR email = ? LIMIT 1`;
      db.query(findClienteQuery, [cliente.telefono, cliente.email], (err, clienteResult) => {
        let clienteId;

        const createOrden = (clienteId) => {
          const ordenData = {
            clientes_id: clienteId,
            usuarios_id: recepcionista_id,
            numero_orden,
            status: 'Aberto',
            prioridad,
            descricaoProduto: `${equipo.tipo_equipo} ${equipo.marca} ${equipo.modelo}`,
            defeito: equipo.problema_reportado,
            tipo_equipo: equipo.tipo_equipo,
            marca: equipo.marca,
            modelo: equipo.modelo,
            serial: equipo.serial,
            color: equipo.color,
            tiene_dano_fisico: equipo.tiene_dano_fisico ? 1 : 0,
            descripcion_dano_fisico: equipo.descripcion_dano_fisico,
            observacoes: notas_recepcion
          };

          const insertQuery = `INSERT INTO os SET ?`;
          db.query(insertQuery, [ordenData], (err, result) => {
            if (err) return res.status(500).json({ message: "Error al crear orden", error: err.message });

            // Registrar en historial
            registrarHistorial(
              result.insertId,
              recepcionista_id,
              null, // Se puede mejorar pasando el nombre
              'ORDEN_CREADA',
              null,
              'Aberto',
              `Orden ${numero_orden} creada. Equipo: ${equipo.tipo_equipo} ${equipo.marca} ${equipo.modelo}`,
              { cliente, equipo }
            );

            res.status(201).json({
              message: "Orden creada exitosamente",
              data: {
                id: result.insertId,
                numero_orden,
                estado: 'Aberto'
              }
            });
          });
        };

        if (clienteResult && clienteResult.length > 0) {
          createOrden(clienteResult[0].idClientes);
        } else {
          // Crear nuevo cliente
          const clienteData = {
            nomeCliente: cliente.nombre,
            celular: cliente.telefono,
            email: cliente.email
          };
          const insertClienteQuery = `INSERT INTO clientes SET ?`;
          db.query(insertClienteQuery, [clienteData], (err, result) => {
            if (err) return res.status(500).json({ message: "Error al crear cliente", error: err.message });
            createOrden(result.insertId);
          });
        }
      });
    });
  },

  /**
   * PUT /ordenes/:id - Actualizar orden
   */
  updateOrden: (req, res) => {
    const { id } = req.params;
    const { 
      tecnico_id, 
      notas_internas, 
      notas_recepcion,
      fecha_entrega_estimada,
      prioridad
    } = req.body;

    const updateData = {};
    if (tecnico_id !== undefined) updateData.tecnico_id = tecnico_id;
    if (notas_internas !== undefined) updateData.laudoTecnico = notas_internas;
    if (notas_recepcion !== undefined) updateData.observacoes = notas_recepcion;
    if (fecha_entrega_estimada !== undefined) updateData.dataEntregaEstimada = fecha_entrega_estimada;
    if (prioridad !== undefined) updateData.prioridad = prioridad;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    const query = `UPDATE os SET ? WHERE idOs = ?`;
    db.query(query, [updateData, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      res.status(200).json({ message: "Orden actualizada exitosamente" });
    });
  },

  /**
   * PUT /ordenes/:id/estado - Cambiar estado de orden
   */
  cambiarEstado: (req, res) => {
    const { id } = req.params;
    const { estado, notas } = req.body;

    if (!estado) {
      return res.status(400).json({ message: "Estado es requerido" });
    }

    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ message: `Estado inválido. Estados permitidos: ${ESTADOS.join(', ')}` });
    }

    // Obtener estado actual
    const getQuery = `SELECT status FROM os WHERE idOs = ?`;
    db.query(getQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      const estadoActual = result[0].status;
      const transicionesPermitidas = TRANSICIONES[estadoActual] || [];

      if (!transicionesPermitidas.includes(estado)) {
        return res.status(400).json({ 
          error: "Transición de estado no permitida",
          mensaje: `No se puede pasar de '${estadoActual}' a '${estado}'`,
          transiciones_permitidas: transicionesPermitidas
        });
      }

      // Actualizar estado
      const updateData = { status: estado };
      if (estado === 'Finalizado') {
        updateData.dataFinal = new Date();
      }

      const updateQuery = `UPDATE os SET ? WHERE idOs = ?`;
      db.query(updateQuery, [updateData, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

        // Registrar en historial
        const { usuario_id, usuario_nombre } = req.body;
        registrarHistorial(
          id,
          usuario_id,
          usuario_nombre,
          'CAMBIO_ESTADO',
          estadoActual,
          estado,
          notas || `Estado cambiado de "${estadoActual}" a "${estado}"`,
          null
        );

        res.status(200).json({
          message: "Estado actualizado",
          data: {
            estado_anterior: estadoActual,
            estado_nuevo: estado,
            notificacion_enviada: false // TODO: implementar notificaciones
          }
        });
      });
    });
  },

  /**
   * PUT /ordenes/:id/asignar - Asignar técnico a orden
   */
  asignarTecnico: (req, res) => {
    const { id } = req.params;
    const { tecnico_id } = req.body;

    if (!tecnico_id) {
      return res.status(400).json({ message: "tecnico_id es requerido" });
    }

    // Verificar que el técnico existe
    const checkQuery = `SELECT idUsuarios, nome FROM usuarios WHERE idUsuarios = ? AND (rol = 'tecnico' OR rol = 'admin')`;
    db.query(checkQuery, [tecnico_id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (!result || result.length === 0) {
        return res.status(404).json({ message: "Técnico no encontrado" });
      }

      const tecnico = result[0];

      const updateQuery = `UPDATE os SET tecnico_id = ? WHERE idOs = ?`;
      db.query(updateQuery, [tecnico_id, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Orden no encontrada" });
        }

        // Registrar en historial
        const { usuario_id, usuario_nombre } = req.body;
        registrarHistorial(
          id,
          usuario_id,
          usuario_nombre,
          'TECNICO_ASIGNADO',
          null,
          null,
          `Técnico asignado: ${tecnico.nome}`,
          { tecnico_id: tecnico.idUsuarios, tecnico_nombre: tecnico.nome }
        );

        res.status(200).json({ 
          message: "Técnico asignado exitosamente",
          tecnico: {
            id: tecnico.idUsuarios,
            nombre: tecnico.nome
          }
        });
      });
    });
  },

  /**
   * PUT /ordenes/:id/equipo - Actualizar datos del equipo
   */
  updateEquipo: (req, res) => {
    const { id } = req.params;
    const { diagnostico, solucion_aplicada } = req.body;

    const updateData = {};
    if (diagnostico !== undefined) updateData.diagnostico = diagnostico;
    if (solucion_aplicada !== undefined) updateData.solucion_aplicada = solucion_aplicada;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    const query = `UPDATE os SET ? WHERE idOs = ?`;
    db.query(query, [updateData, id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      res.status(200).json({ message: "Equipo actualizado exitosamente" });
    });
  },

  /**
   * GET /ordenes/:id/historial - Obtener historial de una orden
   */
  getHistorial: (req, res) => {
    const { id } = req.params;

    const query = `
      SELECT 
        id,
        orden_id,
        usuario_id,
        usuario_nombre,
        accion,
        estado_anterior,
        estado_nuevo,
        descripcion,
        datos_adicionales,
        created_at
      FROM orden_historial
      WHERE orden_id = ?
      ORDER BY created_at DESC
    `;

    db.query(query, [id], (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const historial = result.map(h => {
        // datos_adicionales puede venir como string o como objeto dependiendo del driver
        let datosAdicionales = null;
        if (h.datos_adicionales) {
          datosAdicionales = typeof h.datos_adicionales === 'string' 
            ? JSON.parse(h.datos_adicionales) 
            : h.datos_adicionales;
        }
        
        return {
          id: h.id,
          orden_id: h.orden_id,
          usuario: {
            id: h.usuario_id,
            nombre: h.usuario_nombre || 'Sistema'
          },
          accion: h.accion,
          estado_anterior: h.estado_anterior,
          estado_nuevo: h.estado_nuevo,
          descripcion: h.descripcion,
          datos_adicionales: datosAdicionales,
          fecha: h.created_at
        };
      });

      res.status(200).json({ data: historial });
    });
  }
};

module.exports = OrdenesController;
