const ClientesModel = require("../models/clientesModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const ClientesController = {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Cliente:
   *       type: object
   *       properties:
   *         idClientes:
   *           type: integer
   *         nomeCliente:
   *           type: string
   *         email:
   *           type: string
   *         senha:
   *           type: string
   */

  /**
   * @swagger
   * /clientes:
   *   get:
   *     summary: Obtiene la lista de clientes
   *     responses:
   *       200:
   *         description: Lista de clientes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Cliente'
   */
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

  /**
   * @swagger
   * /clientes:
   *   post:
   *     summary: Crea un nuevo cliente
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Cliente'
   *     responses:
   *       201:
   *         description: Cliente añadido con éxito
   *       500:
   *         description: Error en el servidor
   */
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

  /**
   * @swagger
   * /clientes/{id}:
   *   put:
   *     summary: Actualiza un cliente existente
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
   *             $ref: '#/components/schemas/Cliente'
   *     responses:
   *       200:
   *         description: Cliente editado con éxito
   *       404:
   *         description: Cliente no encontrado
   *       500:
   *         description: Error en el servidor
   */
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

  /**
   * @swagger
   * /clientes/{id}:
   *   delete:
   *     summary: Elimina un cliente existente
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

  /**
   * @swagger
   * /clientes/login:
   *   post:
   *     summary: Autentica un cliente
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

  /**
   * @swagger
   * /clientes/os/{id}:
   *   get:
   *     summary: Obtiene las órdenes de servicio de un cliente por ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: Ordenes de servicio
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
   *                   defeito:
   *                     type: string
   *                   observacoes:
   *                     type: string
   *                   dataInicial:
   *                     type: string
   *                     format: date-time
   *                   dataFinal:
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
  getOsByIdClientes: (req, res) => {
    const { id } = req.params;
    console.log("ID del cliente:", id); // Añade logs para depuración
    console.log("Token JWT:", req.headers.authorization); // Añade logs para depuración
    ClientesModel.getAllOsByClient(id, (err, os) => {
      if (err) return res.status(500).send(err);
      res.status(200).send({ message: "Ordenes de servicio", result: os });
    });
  },

  /**
   * @swagger
   * /clientes/compras/{id}:
   *   get:
   *     summary: Obtiene todas las compras de un cliente por ID
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
   *                   dataCompra:
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
  getAllComprasByClientes_id: (req, res) => {
    const { id } = req.params;
    ClientesModel.getAllComprasByClientes_id(id, (err, compras) => {
      if (err) return res.status(500(err));
      res.status(200).send({ message: "Compras del cliente", result: compras });
    });
  },
  
  /**
   * @swagger
   * /clientes/cobranzas/{id}:
   *   get:
   *     summary: Obtiene todas las cobranzas de un cliente por ID
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
   *                   idCobranza:
   *                     type: integer
   *                   descricaoCobranza:
   *                     type: string
   *                   dataCobranza:
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
