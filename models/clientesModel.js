const db = require("../config/config");

const ClientesModel = {
  get: (table, fields, where, limit, offset, callback) => {
    let query = `SELECT ${fields} FROM ?? ORDER BY idClientes DESC LIMIT ? OFFSET ?`;
    if (where) {
      query = `SELECT ${fields} FROM ?? WHERE ${where} ORDER BY idClientes DESC LIMIT ? OFFSET ?`;
    }
    db.query(query, [table, limit, offset], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  getById: (id, callback) => {
    const query = `SELECT * FROM clientes WHERE idClientes = ? LIMIT 1`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  add: (table, data, callback) => {
    const query = `INSERT INTO ?? SET ?`;
    db.query(query, [table, data], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result.insertId);
    });
  },

  edit: (table, data, fieldID, ID, callback) => {
    const query = `UPDATE ?? SET ? WHERE ?? = ?`;
    db.query(query, [table, data, fieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  delete: (table, fieldID, ID, callback) => {
    const query = `DELETE FROM ?? WHERE ?? = ?`;
    db.query(query, [table, fieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  getAllOsByClient: (id, callback) => {
    const query = `SELECT * FROM os WHERE clientes_id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  removeClientOs: (osIds, callback) => {
    let query = `DELETE FROM servicos_os WHERE os_id IN (?)`;
    db.query(query, [osIds], (err, result) => {
      if (err) return callback(err, null);
      query = `DELETE FROM produtos_os WHERE os_id IN (?)`;
      db.query(query, [osIds], (err, result) => {
        if (err) return callback(err, null);
        query = `DELETE FROM os WHERE idOs IN (?)`;
        db.query(query, [osIds], (err, result) => {
          if (err) return callback(err, null);
          return callback(null, result);
        });
      });
    });
  },

  getAllVendasByClient: (id, callback) => {
    const query = `SELECT * FROM vendas WHERE clientes_id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  removeClientVendas: (vendaIds, callback) => {
    let query = `DELETE FROM itens_de_vendas WHERE vendas_id IN (?)`;
    db.query(query, [vendaIds], (err, result) => {
      if (err) return callback(err, null);
      query = `DELETE FROM vendas WHERE idVendas IN (?)`;
      db.query(query, [vendaIds], (err, result) => {
        if (err) return callback(err, null);
        return callback(null, result);
      });
    });
  },
};

module.exports = ClientesModel;
