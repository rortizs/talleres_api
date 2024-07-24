const ApiModel = require("../models/apiModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UsuariosController = {
  getUsuarios: (req, res) => {
    const { id, search, perPage = 20, page = 0 } = req.query;
    const start = page ? perPage * page : 0;

    if (id) {
      ApiModel.getRowById("usuarios", "idUsuarios", id, (err, usuario) => {
        if (err) return res.status(500).send(err);
        if (!usuario)
          return res.status(404).send({ message: "Usuario no encontrado" });
        res
          .status(200)
          .send({ message: "Detalles del usuario", result: usuario });
      });
    } else {
      const where = search
        ? `nome LIKE '%${search}%' OR email LIKE '%${search}%'`
        : "";

      ApiModel.get("usuarios", "*", where, perPage, start, (err, usuarios) => {
        if (err) return res.status(500).send(err);
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

  createUsuario: (req, res) => {
    const { nome, email, senha, ...otherData } = req.body;
    const hashedPassword = bcrypt.hashSync(senha, 10);

    const data = { nome, email, senha: hashedPassword, ...otherData };

    ApiModel.add("usuarios", data, (err, result) => {
      if (err) return res.status(500).send(err);
      ApiModel.getRowById(
        "usuarios",
        "idUsuarios",
        result.insertId,
        (err, usuario) => {
          if (err) return res.status(500).send(err);
          res
            .status(201)
            .send({ message: "Usuario añadido con éxito", result: usuario });
        }
      );
    });
  },

  updateUsuario: (req, res) => {
    const { id } = req.params;
    const { senha, ...otherData } = req.body;

    const data = { ...otherData };

    if (senha) {
      data.senha = bcrypt.hashSync(senha, 10);
    }

    ApiModel.edit("usuarios", data, "idUsuarios", id, (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Usuario no encontrado" });
      ApiModel.getRowById("usuarios", "idUsuarios", id, (err, usuario) => {
        if (err) return res.status(500).send(err);
        res
          .status(200)
          .send({ message: "Usuario editado con éxito", result: usuario });
      });
    });
  },

  deleteUsuario: (req, res) => {
    const { id } = req.params;

    ApiModel.delete("usuarios", "idUsuarios", id, (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Usuario no encontrado" });
      res.status(200).send({ message: "Usuario eliminado con éxito" });
    });
  },

  login: (req, res) => {
    const { email, password } = req.body;

    ApiModel.getUserByEmail(email, (err, user) => {
      if (err) return res.status(500).send(err);
      if (!user || !bcrypt.compareSync(password, user.senha)) {
        return res.status(401).send({ message: "Credenciales incorrectas" });
      }

      const token = jwt.sign(
        { id: user.idUsuarios, email: user.email },
        "secret",
        {
          expiresIn: "1h",
        }
      );

      res.status(200).send({ message: "Login exitoso", token });
    });
  },
};

module.exports = UsuariosController;
