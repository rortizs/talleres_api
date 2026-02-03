const ApiModel = require("../models/apiModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const UsuariosController = {
  /**
   * Get users with optional search and pagination
   */
  getUsuarios: (req, res) => {
    const { id, search, perPage = 20, page = 0 } = req.query;
    const start = page ? parseInt(perPage) * parseInt(page) : 0;

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
      ApiModel.get("usuarios", "*", search || "", perPage, start, (err, usuarios) => {
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
    const { nome, email, senha, ...otherData } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).send({ message: "Nombre, email y contraseña son requeridos" });
    }

    const hashedPassword = bcrypt.hashSync(senha, 10);
    const data = { nome, email, senha: hashedPassword, ...otherData };

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
    const { senha, ...otherData } = req.body;

    const data = { ...otherData };

    if (senha) {
      data.senha = bcrypt.hashSync(senha, 10);
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
        { id: user.idUsuarios, email: user.email, rol: "usuario" },
        keys.secretOrKey,
        {
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
    const userId = req.user.id;

    ApiModel.getUserById(userId, (err, user) => {
      if (err) return res.status(500).send({ message: "Error del servidor", error: err.message });
      if (!user) return res.status(404).send({ message: "Usuario no encontrado" });

      res.status(200).send({
        id: user.idUsuarios,
        nome: user.nome,
        email: user.email,
        rol: "usuario",
      });
    });
  },
};

module.exports = UsuariosController;
