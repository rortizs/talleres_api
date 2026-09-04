const db = require("../config/config");

const ALLOWED_TABLES = Object.freeze({
  clientes: {
    idColumns: new Set(["idClientes"]),
    orderColumn: "idClientes",
    columnSelectors: new Set(["*"]),
  },
});

function resolveTable(table) {
  const config = ALLOWED_TABLES[table];
  if (!config) throw new Error(`Unsupported table identifier: ${table}`);
  return config;
}

function resolveColumnSelector(config, fields) {
  if (!config.columnSelectors.has(fields)) throw new Error(`Unsupported column selector: ${fields}`);
  return fields;
}

function resolveIdColumn(config, idColumn) {
  if (!config.idColumns.has(idColumn)) throw new Error(`Unsupported id column identifier: ${idColumn}`);
  return idColumn;
}

function guard(callback, fn) {
  try { return fn(); } catch (error) { callback(error, null); return null; }
}

function escapeLikeSearch(search) {
  return String(search).replace(/[\\%_]/g, "\\$&");
}

const ClientesModel = {
  /**
   * Get clients with optional search (SAFE - parameterized query)
   * @param {string} table - Table name
   * @param {string} fields - Fields to select
   * @param {string|null} search - Search term (will be sanitized)
   * @param {number} limit - Results per page
   * @param {number} offset - Offset for pagination
   * @param {function} callback - Callback function
   */
  get: (table, fields, search, limit, offset, callback) => {
    let query;
    let params;
    let config;

    config = guard(callback, () => resolveTable(table));
    if (!config) return;
    const safeFields = guard(callback, () => resolveColumnSelector(config, fields));
    if (!safeFields) return;

    if (search && search.trim() !== "") {
      // Parameterized search to prevent SQL injection
      query = `SELECT ${safeFields} FROM ?? WHERE nomeCliente LIKE ? ESCAPE '\\\\' OR documento LIKE ? ESCAPE '\\\\' OR telefone LIKE ? ESCAPE '\\\\' OR celular LIKE ? ESCAPE '\\\\' OR email LIKE ? ESCAPE '\\\\' OR contato LIKE ? ESCAPE '\\\\' ORDER BY ?? DESC LIMIT ? OFFSET ?`;
      const searchPattern = `%${escapeLikeSearch(search)}%`;
      params = [table, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, config.orderColumn, parseInt(limit), parseInt(offset)];
    } else {
      query = `SELECT ${safeFields} FROM ?? ORDER BY ?? DESC LIMIT ? OFFSET ?`;
      params = [table, config.orderColumn, parseInt(limit), parseInt(offset)];
    }

    db.query(query, params, (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Get client by ID
   */
  getById: (id, callback) => {
    const query = `SELECT * FROM clientes WHERE idClientes = ? LIMIT 1`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  /**
   * Get client by email
   */
  getClienteByEmail: (email, callback) => {
    const query = `SELECT * FROM clientes WHERE email = ? LIMIT 1`;
    db.query(query, [email], (err, result) => {
      if (err) return callback(err, null); // Fixed: was 'erro'
      return callback(null, result[0]);
    });
  },

  /**
   * Add a new record
   */
  add: (table, data, callback) => {
    if (!guard(callback, () => resolveTable(table))) return;
    const query = `INSERT INTO ?? SET ?`;
    db.query(query, [table, data], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result.insertId);
    });
  },

  /**
   * Edit an existing record
   */
  edit: (table, data, fieldID, ID, callback) => {
    const safeFieldID = guard(callback, () => resolveIdColumn(resolveTable(table), fieldID));
    if (!safeFieldID) return;
    const query = `UPDATE ?? SET ? WHERE ?? = ?`;
    db.query(query, [table, data, safeFieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Delete a record
   */
  delete: (table, fieldID, ID, callback) => {
    const safeFieldID = guard(callback, () => resolveIdColumn(resolveTable(table), fieldID));
    if (!safeFieldID) return;
    const query = `DELETE FROM ?? WHERE ?? = ?`;
    db.query(query, [table, safeFieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Get all service orders for a client
   */
  getAllOsByClient: (id, callback) => {
    const query = `SELECT * FROM os WHERE clientes_id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Remove client's service orders (cascade delete)
   */
  removeClientOs: (osIds, callback) => {
    // Handle empty array case
    if (!osIds || osIds.length === 0) {
      return callback(null, { affectedRows: 0 });
    }

    const query1 = `DELETE FROM servicos_os WHERE os_id IN (?)`;
    db.query(query1, [osIds], (err, result) => {
      if (err) return callback(err, null);
      
      const query2 = `DELETE FROM produtos_os WHERE os_id IN (?)`;
      db.query(query2, [osIds], (err, result) => {
        if (err) return callback(err, null);
        
        const query3 = `DELETE FROM os WHERE idOs IN (?)`;
        db.query(query3, [osIds], (err, result) => {
          if (err) return callback(err, null);
          return callback(null, result);
        });
      });
    });
  },

  /**
   * Get all sales for a client
   */
  getAllVendasByClient: (id, callback) => {
    const query = `SELECT * FROM vendas WHERE clientes_id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Remove client's sales (cascade delete)
   */
  removeClientVendas: (vendaIds, callback) => {
    // Handle empty array case
    if (!vendaIds || vendaIds.length === 0) {
      return callback(null, { affectedRows: 0 });
    }

    const query1 = `DELETE FROM itens_de_vendas WHERE vendas_id IN (?)`;
    db.query(query1, [vendaIds], (err, result) => {
      if (err) return callback(err, null);
      
      const query2 = `DELETE FROM vendas WHERE idVendas IN (?)`;
      db.query(query2, [vendaIds], (err, result) => {
        if (err) return callback(err, null);
        return callback(null, result);
      });
    });
  },

  /**
   * Get all charges for a client
   */
  getAllCobranzasByClientes_id: (id, callback) => {
    const query = `SELECT * FROM cobrancas WHERE clientes_id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Get all purchases for a client
   */
  getAllComprasByClientes_id: (id, callback) => {
    const query = `SELECT * FROM vendas WHERE clientes_id = ?`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },
};

module.exports = ClientesModel;
