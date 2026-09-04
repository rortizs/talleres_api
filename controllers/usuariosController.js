const ApiModel = require("../models/apiModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const { success } = require("../utils/apiResponse");
const { sendValidationError, validatePagination } = require("../validators/common");
const { validateCreateUsuario, validateUpdateUsuario } = require("../validators/usuarios");

const UsuariosController = {
  /**
   * Get users with optional search and pagination
   */
  getUsuarios: (req, res) => {
    const { id } = req.query;
    const pagination = validatePagination(req.query);

    if (pagination.errors.length > 0) {
      return sendValidationError(res, pagination.errors);
    }

    if (id) {
      ApiModel.getRowById("usuarios", "idUsuarios", id, (err, usuario) => {
        if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
        if (!usuario)
          return res.status(404).send({ message: "Usuario no encontrado" });
        res
          .status(200)
          .send({ message: "Detalles del usuario", result: usuario });
      });
    } else {
      // Pass search term directly - model handles parameterization
      ApiModel.get("usuarios", "*", pagination.search, pagination.perPage, pagination.start, (err, usuarios) => {
        if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
        if (!usuarios || usuarios.length === 0)
          return res
            .status(404)
            .send({ message: "Ningún usuario localizado." });
        res
          .status(200)
          .send({ message: "Lista de usuarios", result: usuarios });
      });
    }
  },

  /**
   * Create a new user
   */
  createUsuario: (req, res) => {
    const validation = validateCreateUsuario(req.body || {});

    if (validation.errors.length > 0) {
      return sendValidationError(res, validation.errors);
    }

    const data = { ...validation.data };
    data.senha = bcrypt.hashSync(data.senha, 10);

    ApiModel.add("usuarios", data, (err, result) => {
      if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
      ApiModel.getRowById(
        "usuarios",
        "idUsuarios",
        result.insertId,
        (err, usuario) => {
          if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
          res
            .status(201)
            .send({ message: "Usuario añadido con éxito", result: usuario });
        }
      );
    });
  },

  /**
   * Update an existing user
   */
  updateUsuario: (req, res) => {
    const { id } = req.params;
    const validation = validateUpdateUsuario(req.body || {});

    if (validation.errors.length > 0) {
      return sendValidationError(res, validation.errors);
    }

    const data = { ...validation.data };

    if (data.senha) {
      data.senha = bcrypt.hashSync(data.senha, 10);
    }

    ApiModel.edit("usuarios", data, "idUsuarios", id, (err, result) => {
      if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Usuario no encontrado" });
      ApiModel.getRowById("usuarios", "idUsuarios", id, (err, usuario) => {
        if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
        res
          .status(200)
          .send({ message: "Usuario editado con éxito", result: usuario });
      });
    });
  },

  /**
   * Delete a user
   */
  deleteUsuario: (req, res) => {
    const { id } = req.params;

    ApiModel.delete("usuarios", "idUsuarios", id, (err, result) => {
      if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Usuario no encontrado" });
      res.status(200).send({ message: "Usuario eliminado con éxito" });
    });
  },

  /**
   * User login
   */
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ message: "Email y contraseña son requeridos" });
    }

    ApiModel.getUserByEmail(email, (err, user) => {
      if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
      if (!user || !bcrypt.compareSync(password, user.senha)) {
        return res.status(401).send({ message: "Credenciales incorrectas" });
      }

      const token = jwt.sign(
        { id: user.idUsuarios, email: user.email, nome: user.nome, rol: "usuario" },
        keys.secretOrKey,
        {
          algorithm: (keys.algorithms && keys.algorithms[0]) || "HS256",
          expiresIn: keys.expiresIn || "1h",
        }
      );

      res.status(200).send({
        message: "Login exitoso",
        token,
        user: {
          id: user.idUsuarios,
          nome: user.nome,
          email: user.email,
          rol: "usuario",
        },
      });
    });
  },

  /**
   * Get current authenticated user
   */
  getMe: (req, res) => {
    success(res, {
      id: req.user.id,
      email: req.user.email,
      nome: req.user.nome,
      rol: req.user.rol,
    });
  },
};

module.exports = UsuariosController;
