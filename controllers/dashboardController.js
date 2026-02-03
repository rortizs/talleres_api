const db = require("../config/config");

const DashboardController = {
  /**
   * GET /dashboard/stats - Estadísticas para el dashboard
   */
  getStats: (req, res) => {
    const stats = {
      ordenes: {
        total_activas: 0,
        por_estado: {},
        atrasadas: 0
      },
      hoy: {
        ordenes_recibidas: 0,
        ordenes_entregadas: 0,
        cotizaciones_enviadas: 0
      },
      alertas: []
    };

    // Query 1: Total órdenes activas (no entregadas ni canceladas)
    const activasQuery = `
      SELECT COUNT(*) as total 
      FROM os 
      WHERE status NOT IN ('Entregue', 'Cancelado')
    `;

    // Query 2: Órdenes por estado
    const porEstadoQuery = `
      SELECT status, COUNT(*) as count 
      FROM os 
      WHERE status NOT IN ('Entregue', 'Cancelado')
      GROUP BY status
    `;

    // Query 3: Órdenes atrasadas (más de 5 días sin entregar)
    const atrasadasQuery = `
      SELECT COUNT(*) as total 
      FROM os 
      WHERE status NOT IN ('Entregue', 'Cancelado')
      AND DATEDIFF(CURDATE(), dataInicial) > 5
    `;

    // Query 4: Órdenes recibidas hoy
    const hoyRecibidasQuery = `
      SELECT COUNT(*) as total 
      FROM os 
      WHERE DATE(dataInicial) = CURDATE()
    `;

    // Query 5: Órdenes entregadas hoy
    const hoyEntregadasQuery = `
      SELECT COUNT(*) as total 
      FROM os 
      WHERE DATE(dataFinal) = CURDATE() AND status = 'Entregue'
    `;

    // Query 6: Alertas - órdenes atrasadas con detalles
    const alertasQuery = `
      SELECT 
        idOs as id,
        numero_orden,
        DATEDIFF(CURDATE(), dataInicial) as dias
      FROM os 
      WHERE status NOT IN ('Entregue', 'Cancelado')
      AND DATEDIFF(CURDATE(), dataInicial) > 5
      ORDER BY dias DESC
      LIMIT 5
    `;

    // Ejecutar todas las queries
    db.query(activasQuery, (err, activasResult) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
      stats.ordenes.total_activas = activasResult[0].total;

      db.query(porEstadoQuery, (err, estadoResult) => {
        if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
        
        estadoResult.forEach(row => {
          stats.ordenes.por_estado[row.status] = row.count;
        });

        db.query(atrasadasQuery, (err, atrasadasResult) => {
          if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
          stats.ordenes.atrasadas = atrasadasResult[0].total;

          db.query(hoyRecibidasQuery, (err, hoyRecibidas) => {
            if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
            stats.hoy.ordenes_recibidas = hoyRecibidas[0].total;

            db.query(hoyEntregadasQuery, (err, hoyEntregadas) => {
              if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
              stats.hoy.ordenes_entregadas = hoyEntregadas[0].total;

              db.query(alertasQuery, (err, alertasResult) => {
                if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });
                
                stats.alertas = alertasResult.map(row => ({
                  tipo: 'orden_atrasada',
                  mensaje: `Orden #${row.numero_orden} lleva ${row.dias} días sin actualizar`,
                  orden_id: row.id
                }));

                res.status(200).json(stats);
              });
            });
          });
        });
      });
    });
  },

  /**
   * GET /dashboard/resumen - Resumen general
   */
  getResumen: (req, res) => {
    const resumenQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clientes) as total_clientes,
        (SELECT COUNT(*) FROM os) as total_ordenes,
        (SELECT COUNT(*) FROM os WHERE status NOT IN ('Entregue', 'Cancelado')) as ordenes_activas,
        (SELECT COUNT(*) FROM licencias WHERE activa = 1) as licencias_activas,
        (SELECT COALESCE(SUM(valorTotal), 0) FROM os WHERE status = 'Entregue' AND MONTH(dataFinal) = MONTH(CURDATE()) AND YEAR(dataFinal) = YEAR(CURDATE())) as facturado_mes,
        (SELECT COALESCE(SUM(valorTotal - anticipo), 0) FROM os WHERE status NOT IN ('Entregue', 'Cancelado')) as pendiente_cobro
    `;

    db.query(resumenQuery, (err, result) => {
      if (err) return res.status(500).json({ message: "Error del servidor", error: err.message });

      const r = result[0];
      res.status(200).json({
        total_clientes: r.total_clientes,
        total_ordenes: r.total_ordenes,
        ordenes_activas: r.ordenes_activas,
        licencias_activas: r.licencias_activas,
        facturado_mes: parseFloat(r.facturado_mes) || 0,
        pendiente_cobro: parseFloat(r.pendiente_cobro) || 0
      });
    });
  }
};

module.exports = DashboardController;
