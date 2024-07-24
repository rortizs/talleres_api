const ClientesModel = require("../models/clientesModel");
const bcrypt = require("bcryptjs");

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
};

module.exports = ClientesController;
