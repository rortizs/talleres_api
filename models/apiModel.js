const db = require("../config/config");

const ALLOWED_TABLES = Object.freeze({
  usuarios: {
    idColumns: new Set(["idUsuarios"]),
    orderColumn: "idUsuarios",
    columnSelectors: new Set(["*", "idUsuarios, nome, email"]),
  },
});

function resolveTable(table) {
  const config = ALLOWED_TABLES[table];
  if (!config) throw new Error(`Unsupported table identifier: ${table}`);
  return config;
}

function resolveColumnSelector(config, columns) {
  if (!config.columnSelectors.has(columns)) throw new Error(`Unsupported column selector: ${columns}`);
  return columns;
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

const ApiModel = {
  /**
   * Get the last row from a table
   */
  lastRow: (table, idColumn, callback) => {
    const safeIdColumn = guard(callback, () => resolveIdColumn(resolveTable(table), idColumn));
    if (!safeIdColumn) return;
    const query = `SELECT * FROM ?? ORDER BY ?? DESC LIMIT 1`;
    db.query(query, [table, safeIdColumn], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  /**
   * Get a single row by ID
   */
  getRowById: (table, idColumn, id, callback) => {
    const safeIdColumn = guard(callback, () => resolveIdColumn(resolveTable(table), idColumn));
    if (!safeIdColumn) return;
    const query = `SELECT * FROM ?? WHERE ?? = ? LIMIT 1`;
    db.query(query, [table, safeIdColumn, id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  /**
   * Get user by ID (for JWT authentication)
   */
  getUserById: (id, callback) => {
    const query = `SELECT * FROM usuarios WHERE idUsuarios = ? LIMIT 1`;
    db.query(query, [id], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  /**
   * Get user by email
   */
  getUserByEmail: (email, callback) => {
    const query = `SELECT * FROM usuarios WHERE email = ? LIMIT 1`;
    db.query(query, [email], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  /**
   * Search users by name (parameterized to prevent SQL injection)
   */
  searchUsuario: (search, callback) => {
    const query = `SELECT * FROM usuarios WHERE nome LIKE ? ESCAPE '\\\\' AND situacao = 1 LIMIT 5`;
    db.query(query, [`%${escapeLikeSearch(search)}%`], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Get users with optional search (SAFE - parameterized query)
   * @param {string} table - Table name
   * @param {string} columns - Columns to select
   * @param {string|null} search - Search term (will be sanitized)
   * @param {number} limit - Results per page
   * @param {number} offset - Offset for pagination
   * @param {function} callback - Callback function
   */
  get: (table, columns, search, limit, offset, callback) => {
    let query;
    let params;
    let config;

    config = guard(callback, () => resolveTable(table));
    if (!config) return;
    const safeColumns = guard(callback, () => resolveColumnSelector(config, columns));
    if (!safeColumns) return;

    if (search && search.trim() !== "") {
      // Parameterized search to prevent SQL injection
      query = `SELECT ${safeColumns} FROM ?? WHERE nome LIKE ? ESCAPE '\\\\' OR email LIKE ? ESCAPE '\\\\' ORDER BY ?? DESC LIMIT ? OFFSET ?`;
      const searchPattern = `%${escapeLikeSearch(search)}%`;
      params = [table, searchPattern, searchPattern, config.orderColumn, parseInt(limit), parseInt(offset)];
    } else {
      query = `SELECT ${safeColumns} FROM ?? ORDER BY ?? DESC LIMIT ? OFFSET ?`;
      params = [table, config.orderColumn, parseInt(limit), parseInt(offset)];
    }

    db.query(query, params, (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
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
      return callback(null, result);
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
};

module.exports = ApiModel;
