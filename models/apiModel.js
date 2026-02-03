const db = require("../config/config");

const ApiModel = {
  /**
   * Get the last row from a table
   */
  lastRow: (table, idColumn, callback) => {
    const query = `SELECT * FROM ?? ORDER BY ?? DESC LIMIT 1`;
    db.query(query, [table, idColumn], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result[0]);
    });
  },

  /**
   * Get a single row by ID
   */
  getRowById: (table, idColumn, id, callback) => {
    const query = `SELECT * FROM ?? WHERE ?? = ? LIMIT 1`;
    db.query(query, [table, idColumn, id], (err, result) => {
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
    const query = `SELECT * FROM usuarios WHERE nome LIKE ? AND situacao = 1 LIMIT 5`;
    db.query(query, [`%${search}%`], (err, result) => {
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

    if (search && search.trim() !== "") {
      // Parameterized search to prevent SQL injection
      query = `SELECT ${columns} FROM ?? WHERE nome LIKE ? OR email LIKE ? ORDER BY idUsuarios DESC LIMIT ? OFFSET ?`;
      const searchPattern = `%${search}%`;
      params = [table, searchPattern, searchPattern, parseInt(limit), parseInt(offset)];
    } else {
      query = `SELECT ${columns} FROM ?? ORDER BY idUsuarios DESC LIMIT ? OFFSET ?`;
      params = [table, parseInt(limit), parseInt(offset)];
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
    const query = `UPDATE ?? SET ? WHERE ?? = ?`;
    db.query(query, [table, data, fieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },

  /**
   * Delete a record
   */
  delete: (table, fieldID, ID, callback) => {
    const query = `DELETE FROM ?? WHERE ?? = ?`;
    db.query(query, [table, fieldID, ID], (err, result) => {
      if (err) return callback(err, null);
      return callback(null, result);
    });
  },
};

module.exports = ApiModel;
