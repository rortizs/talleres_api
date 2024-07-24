const express = require("express");
const passport = require("passport");
const router = express.Router();
const UsuariosController = require("../controllers/usuariosController");
const ClientesController = require("../controllers/clientesController");

// Rutas de usuarios
router.get(
  "/usuarios",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.getUsuarios
);
router.post(
  "/usuarios",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.createUsuario
);
router.put(
  "/usuarios/:id",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.updateUsuario
);
router.delete(
  "/usuarios/:id",
  passport.authenticate("jwt", { session: false }),
  UsuariosController.deleteUsuario
);
router.post("/login", UsuariosController.login);

// Rutas de clientes
router.get(
  "/clientes",
  passport.authenticate("jwt", { session: false }),
  ClientesController.getClientes
);
router.get(
  "/clientes/:id",
  passport.authenticate("jwt", { session: false }),
  ClientesController.getClientes
);
router.post(
  "/clientes",
  passport.authenticate("jwt", { session: false }),
  ClientesController.createCliente
);
router.put(
  "/clientes/:id",
  passport.authenticate("jwt", { session: false }),
  ClientesController.updateCliente
);
router.delete(
  "/clientes/:id",
  passport.authenticate("jwt", { session: false }),
  ClientesController.deleteCliente
);
router.get(
  "/clientes/os/:id",
  passport.authenticate("jwt", { session: false }),
  ClientesController.getOsByIdClientes
);
router.post("/clientes/login", ClientesController.login);

module.exports = router;
