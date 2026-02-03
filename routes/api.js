const express = require("express");
const passport = require("passport");
const router = express.Router();
const UsuariosController = require("../controllers/usuariosController");
const ClientesController = require("../controllers/clientesController");
const OrdenesController = require("../controllers/ordenesController");
const LicenciasController = require("../controllers/licenciasController");
const DashboardController = require("../controllers/dashboardController");
const CotizacionesController = require("../controllers/cotizacionesController");
const PreciosController = require("../controllers/preciosController");
const NotificacionesController = require("../controllers/notificacionesController");
const authController = require("../middleware/authMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   - name: Usuarios
 *     description: Operaciones relacionadas con usuarios
 *   - name: Clientes
 *     description: Operaciones relacionadas con clientes
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Obtiene una lista de usuarios
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *         default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idUsuarios:
 *                     type: integer
 *                   nome:
 *                     type: string
 *                   email:
 *                     type: string
 *       404:
 *         description: Ningún usuario localizado.
 *       500:
 *         description: Error en el servidor
 */
// Rutas de usuarios
router.get(
  "/usuarios",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.getUsuarios
);

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario añadido con éxito
 *       500:
 *         description: Error en el servidor
 */
router.post(
  "/usuarios",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.createUsuario
);

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualiza un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario editado con éxito
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.put(
  "/usuarios/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.updateUsuario
);

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Elimina un usuario por ID
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado con éxito
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete(
  "/usuarios/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  UsuariosController.deleteUsuario
);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Inicia sesión como usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error en el servidor
 */
router.post("/login", UsuariosController.login);

/**
 * @swagger
 * /me:
 *  get:
 *   summary: Obtiene los detalles del usuario autenticado
 *  tags: [Usuarios]
 * responses:
 *  200:
 *  description: Detalles del usuario
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * idUsuarios:
 * type: integer
 * nome:
 * type: string
 * email:
 * type: string
 * 401:
 * description: No autorizado
 * 500:
 * description: Error en el servidor
 */
router.get("/me", authMiddleware, UsuariosController.getMe);

/**
 * @swagger
 * /clientes:
 *   get:
 *     summary: Obtiene una lista de clientes
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *         default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 0
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idClientes:
 *                     type: integer
 *                   nomeCliente:
 *                     type: string
 *                   email:
 *                     type: string
 *       404:
 *         description: Ningún cliente localizado.
 *       500:
 *         description: Error en el servidor
 */

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Obtiene los detalles de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalles del Cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idClientes:
 *                   type: integer
 *                 nomeCliente:
 *                   type: string
 *                 email:
 *                   type: string
 *                 ordensServicos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idOs:
 *                         type: integer
 *                       descricaoProduto:
 *                         type: string
 *                       dataCadastro:
 *                         type: string
 *                         format: date-time
 *                       valorTotal:
 *                         type: number
 *                         format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
// Rutas de clientes
router.get(
  "/clientes",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getClientes
);
router.get(
  "/clientes/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getClientes
);

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crea un nuevo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCliente:
 *                 type: string
 *               documento:
 *                 type: string
 *               senha:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente añadido con éxito
 *       500:
 *         description: Error en el servidor
 */
router.post(
  "/clientes",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.createCliente
);

/**
 * @swagger
 * /clientes/{id}:
 *   put:
 *     summary: Actualiza un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCliente:
 *                 type: string
 *               documento:
 *                 type: string
 *               senha:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente editado con éxito
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.put(
  "/clientes/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.updateCliente
);

/**
 * @swagger
 * /clientes/{id}:
 *   delete:
 *     summary: Elimina un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente eliminado con éxito
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.delete(
  "/clientes/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.deleteCliente
);

/**
 * @swagger
 * /clientes/os/{id}:
 *   get:
 *     summary: Obtiene las órdenes de servicio de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ordenes de servicio del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idOs:
 *                     type: integer
 *                   descricaoProduto:
 *                     type: string
 *                   dataCadastro:
 *                     type: string
 *                     format: date-time
 *                   valorTotal:
 *                     type: number
 *                     format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */

router.get(
  "/clientes/os/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getOsByIdClientes
);

/**
 * @swagger
 * /clientes/compras/{id}:
 *   get:
 *     summary: Obtiene las compras de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compras del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idCompra:
 *                     type: integer
 *                   descricaoProduto:
 *                     type: string
 *                   dataCadastro:
 *                     type: string
 *                     format: date-time
 *                   valorTotal:
 *                     type: number
 *                     format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */
router.get(
  "/clientes/compras/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getAllComprasByClientes_id
);

/**
 * @swagger
 * /clientes/cobranzas/{id}:
 *   get:
 *     summary: Obtiene las cobranzas de un cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cobranzas del cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   idCobranca:
 *                     type: integer
 *                   descricaoProduto:
 *                     type: string
 *                   dataCadastro:
 *                     type: string
 *                     format: date-time
 *                   valorTotal:
 *                     type: number
 *                     format: float
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error en el servidor
 */

router.get(
  "/clientes/cobranzas/:id",
  passport.authenticate("jwt-cliente", { session: false }),
  ClientesController.getAllCobranzasByClientes_id
);

/**
 * @swagger
 * /clientes/login:
 *   post:
 *     summary: Inicia sesión como cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales incorrectas
 *       500:
 *         description: Error en el servidor
 */
router.post("/clientes/login", ClientesController.login);

// ============================================================
// ORDENES DE SERVICIO
// ============================================================

/**
 * @swagger
 * /ordenes:
 *   get:
 *     summary: Lista órdenes con filtros y paginación
 *     tags: [Ordenes]
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *         description: Filtrar por estados (comma separated)
 *       - in: query
 *         name: tecnico_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: cliente_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: perPage
 *         schema:
 *           type: integer
 *         default: 20
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *     responses:
 *       200:
 *         description: Lista de órdenes
 */
router.get(
  "/ordenes",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.getOrdenes
);

/**
 * @swagger
 * /ordenes/{id}:
 *   get:
 *     summary: Obtiene detalle completo de una orden
 *     tags: [Ordenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la orden
 *       404:
 *         description: Orden no encontrada
 */
router.get(
  "/ordenes/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.getOrden
);

/**
 * @swagger
 * /ordenes:
 *   post:
 *     summary: Crea una nueva orden
 *     tags: [Ordenes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 */
router.post(
  "/ordenes",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.createOrden
);

/**
 * @swagger
 * /ordenes/{id}:
 *   put:
 *     summary: Actualiza una orden
 *     tags: [Ordenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orden actualizada
 */
router.put(
  "/ordenes/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.updateOrden
);

/**
 * @swagger
 * /ordenes/{id}/estado:
 *   put:
 *     summary: Cambia el estado de una orden
 *     tags: [Ordenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put(
  "/ordenes/:id/estado",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.cambiarEstado
);

/**
 * @swagger
 * /ordenes/{id}/asignar:
 *   put:
 *     summary: Asigna un técnico a la orden
 *     tags: [Ordenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tecnico_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Técnico asignado
 */
router.put(
  "/ordenes/:id/asignar",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.asignarTecnico
);

/**
 * @swagger
 * /ordenes/{id}/equipo:
 *   put:
 *     summary: Actualiza diagnóstico/solución del equipo
 *     tags: [Ordenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Equipo actualizado
 */
router.put(
  "/ordenes/:id/equipo",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.updateEquipo
);

/**
 * @swagger
 * /ordenes/{id}/historial:
 *   get:
 *     summary: Obtiene el historial de cambios de una orden
 *     tags: [Ordenes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de la orden
 */
router.get(
  "/ordenes/:id/historial",
  passport.authenticate("jwt-usuario", { session: false }),
  OrdenesController.getHistorial
);

// ============================================================
// LICENCIAS
// ============================================================

/**
 * @swagger
 * /licencias:
 *   get:
 *     summary: Lista licencias con filtros
 *     tags: [Licencias]
 *     parameters:
 *       - in: query
 *         name: activas
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de licencias
 */
router.get(
  "/licencias",
  passport.authenticate("jwt-usuario", { session: false }),
  LicenciasController.getLicencias
);

/**
 * @swagger
 * /licencias/{id}:
 *   get:
 *     summary: Obtiene detalle de una licencia
 *     tags: [Licencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la licencia
 */
router.get(
  "/licencias/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  LicenciasController.getLicencia
);

/**
 * @swagger
 * /licencias:
 *   post:
 *     summary: Crea una nueva licencia
 *     tags: [Licencias]
 *     responses:
 *       201:
 *         description: Licencia creada
 */
router.post(
  "/licencias",
  passport.authenticate("jwt-usuario", { session: false }),
  LicenciasController.createLicencia
);

/**
 * @swagger
 * /licencias/{id}:
 *   put:
 *     summary: Actualiza una licencia
 *     tags: [Licencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Licencia actualizada
 */
router.put(
  "/licencias/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  LicenciasController.updateLicencia
);

/**
 * @swagger
 * /licencias/{id}/toggle:
 *   put:
 *     summary: Activa/desactiva una licencia
 *     tags: [Licencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado de licencia cambiado
 */
router.put(
  "/licencias/:id/toggle",
  passport.authenticate("jwt-usuario", { session: false }),
  LicenciasController.toggleLicencia
);

/**
 * @swagger
 * /licencias/{id}:
 *   delete:
 *     summary: Elimina una licencia
 *     tags: [Licencias]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Licencia eliminada
 */
router.delete(
  "/licencias/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  LicenciasController.deleteLicencia
);

// ============================================================
// DASHBOARD
// ============================================================

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Estadísticas para el dashboard
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 */
router.get(
  "/dashboard/stats",
  passport.authenticate("jwt-usuario", { session: false }),
  DashboardController.getStats
);

/**
 * @swagger
 * /dashboard/resumen:
 *   get:
 *     summary: Resumen general del sistema
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Resumen general
 */
router.get(
  "/dashboard/resumen",
  passport.authenticate("jwt-usuario", { session: false }),
  DashboardController.getResumen
);

// ============================================================
// COTIZACIONES
// ============================================================

router.get(
  "/cotizaciones",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.getCotizaciones
);

router.get(
  "/cotizaciones/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.getCotizacion
);

router.post(
  "/cotizaciones",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.createCotizacion
);

router.put(
  "/cotizaciones/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.updateCotizacion
);

router.put(
  "/cotizaciones/:id/enviar",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.enviarCotizacion
);

router.put(
  "/cotizaciones/:id/aprobar",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.aprobarCotizacion
);

// Items de cotización
router.post(
  "/cotizaciones/:id/items",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.addItem
);

router.put(
  "/cotizaciones/:id/items/:itemId",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.updateItem
);

router.delete(
  "/cotizaciones/:id/items/:itemId",
  passport.authenticate("jwt-usuario", { session: false }),
  CotizacionesController.deleteItem
);

// ============================================================
// CONFIGURACION DE PRECIOS
// ============================================================

router.get(
  "/configuracion/precios",
  passport.authenticate("jwt-usuario", { session: false }),
  PreciosController.getPrecios
);

router.post(
  "/configuracion/precios",
  passport.authenticate("jwt-usuario", { session: false }),
  PreciosController.createMargen
);

router.post(
  "/configuracion/precios/calcular",
  passport.authenticate("jwt-usuario", { session: false }),
  PreciosController.calcularPrecio
);

router.post(
  "/configuracion/precios/calcular-todos",
  passport.authenticate("jwt-usuario", { session: false }),
  PreciosController.calcularTodos
);

router.put(
  "/configuracion/precios/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  PreciosController.updateMargen
);

router.delete(
  "/configuracion/precios/:id",
  passport.authenticate("jwt-usuario", { session: false }),
  PreciosController.deleteMargen
);

// ============================================================
// NOTIFICACIONES
// ============================================================

router.get(
  "/notificaciones",
  passport.authenticate("jwt-usuario", { session: false }),
  NotificacionesController.getNotificaciones
);

router.get(
  "/notificaciones/pendientes",
  passport.authenticate("jwt-usuario", { session: false }),
  NotificacionesController.getPendientes
);

router.post(
  "/notificaciones/enviar",
  passport.authenticate("jwt-usuario", { session: false }),
  NotificacionesController.enviarNotificacion
);

router.post(
  "/notificaciones/generar-mensaje",
  passport.authenticate("jwt-usuario", { session: false }),
  NotificacionesController.generarMensaje
);

router.post(
  "/notificaciones/:id/reenviar",
  passport.authenticate("jwt-usuario", { session: false }),
  NotificacionesController.reenviarNotificacion
);

router.put(
  "/notificaciones/:id/marcar-enviada",
  passport.authenticate("jwt-usuario", { session: false }),
  NotificacionesController.marcarEnviada
);

module.exports = router;
