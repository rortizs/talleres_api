const ClientesModel = require("../models/clientesModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const ClientesController = {
  getClientes: (req, res) => {
    const { id, search, perPage = 20, page = 0 } = req.query;
    const start = page ? perPage * page : 0;

    if (id) {
      ClientesModel.getById(id, (err, cliente) => {
        if (err) return res.status(500).send(err);
        if (!cliente)
          return res.status(404).send({ message: "Cliente no encontrado" });

        ClientesModel.getAllOsByClient(id, (err, os) => {
          if (err) return res.status(500).send(err);
          cliente.ordensServicos = os;
          res
            .status(200)
            .send({ message: "Detalles del Cliente", result: cliente });
        });
      });
    } else {
      const where = search
        ? `nomeCliente LIKE '%${search}%' OR documento LIKE '%${search}%' OR telefone LIKE '%${search}%' OR celular LIKE '%${search}%' OR email LIKE '%${search}%' OR contato LIKE '%${search}%'`
        : "";

      ClientesModel.get(
        "clientes",
        "*",
        where,
        perPage,
        start,
        (err, clientes) => {
          if (err) return res.status(500).send(err);
          if (!clientes || clientes.length === 0)
            return res
              .status(404)
              .send({ message: "Ningún cliente localizado." });
          res
            .status(200)
            .send({ message: "Lista de Clientes", result: clientes });
        }
      );
    }
  },

  createCliente: (req, res) => {
    const { nomeCliente, documento, senha, ...otherData } = req.body;
    const senhaCliente = senha || documento.replace(/[^\w\s]/gi, "");
    const cpf_cnpj = documento.replace(/[^\w\s]/gi, "");
    const pessoaFisica = cpf_cnpj.length === 11;

    const data = {
      nomeCliente,
      documento,
      senha: bcrypt.hashSync(senhaCliente, 10),
      pessoa_fisica: pessoaFisica,
      ...otherData,
      dataCadastro: new Date(),
      fornecedor: otherData.fornecedor ? 1 : 0,
    };

    ClientesModel.add("clientes", data, (err, result) => {
      if (err) return res.status(500).send(err);
      ClientesModel.getById(result, (err, cliente) => {
        if (err) return res.status(500).send(err);
        res
          .status(201)
          .send({ message: "Cliente añadido con éxito", result: cliente });
      });
    });
  },

  updateCliente: (req, res) => {
    const { id } = req.params;
    const { senha, ...otherData } = req.body;

    const data = {
      ...otherData,
    };

    if (senha) {
      data.senha = bcrypt.hashSync(senha, 10);
    }

    ClientesModel.edit("clientes", data, "idClientes", id, (err, result) => {
      if (err) return res.status(500).send(err);
      if (result.affectedRows === 0)
        return res.status(404).send({ message: "Cliente no encontrado" });
      ClientesModel.getById(id, (err, cliente) => {
        if (err) return res.status(500).send(err);
        res
          .status(200)
          .send({ message: "Cliente editado con éxito", result: cliente });
      });
    });
  },

  deleteCliente: (req, res) => {
    const { id } = req.params;

    ClientesModel.getAllOsByClient(id, (err, os) => {
      if (err) return res.status(500).send(err);
      const osIds = os.map((o) => o.idOs);
      ClientesModel.removeClientOs(osIds, (err, result) => {
        if (err) return res.status(500).send(err);

        ClientesModel.getAllVendasByClient(id, (err, vendas) => {
          if (err) return res.status(500).send(err);
          const vendaIds = vendas.map((v) => v.idVendas);
          ClientesModel.removeClientVendas(vendaIds, (err, result) => {
            if (err) return res.status(500).send(err);

            ClientesModel.delete(
              "clientes",
              "idClientes",
              id,
              (err, result) => {
                if (err) return res.status(500).send(err);
                if (result.affectedRows === 0)
                  return res
                    .status(404)
                    .send({ message: "Cliente no encontrado" });
                res
                  .status(200)
                  .send({ message: "Cliente eliminado con éxito" });
              }
            );
          });
        });
      });
    });
  },

  login: (req, res) => {
    const { email, password } = req.body;

    ClientesModel.getClienteByEmail(email, (err, cliente) => {
      if (err) return res.status(500).send(err);
      // Add logging
      //console.log("Cliente: ", cliente);
      //console.log("Password from request: ", password);
      //console.log("Stored hash: ", cliente.senha);
      //console.log(
      //  "Password match: ",
      //  bcrypt.compareSync(password, cliente.senha)
      //);

      if (
        !cliente ||
        typeof password !== "string" ||
        typeof cliente.senha !== "string" ||
        !bcrypt.compareSync(password, cliente.senha)
      ) {
        return res.status(401).send({ message: "Credenciales incorrectas" });
      }

      const token = jwt.sign(
        { id: cliente.idClientes, email: cliente.email, rol: "cliente" },
        keys.secretOrKey,
        {
          expiresIn: "1h",
        }
      );

      res.status(200).send({ message: "Login exitoso", token });
    });
  },

  getOsByIdClientes: (req, res) => {
    const { id } = req.params;
    console.log("ID del cliente:", id); // Añade logs para depuración
    console.log("Token JWT:", req.headers.authorization); // Añade logs para depuración
    ClientesModel.getAllOsByClient(id, (err, os) => {
      if (err) return res.status(500).send(err);
      res.status(200).send({ message: "Ordenes de servicio", result: os });
    });
  },

  getAllComprasByClientes_id: (req, res) => {
    const { id } = req.params;
    ClientesModel.getAllComprasByClientes_id(id, (err, compras) => {
      if (err) return res.status(500(err));
      res.status(200).send({ message: "Compras del cliente", result: compras });
    });
  },

  getAllCobranzasByClientes_id: (req, res) => {
    const { id } = req.params;
    ClientesModel.getAllCobranzasByClientes_id(id, (err, cobranzas) => {
      if (err) return res.status(500(err));
      res
        .status(200)
        .send({ message: "Cobranzas del cliente", result: cobranzas });
    });
  },
};

module.exports = ClientesController;
