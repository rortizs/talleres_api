const db = require("../config/config");

function withTransaction(work, callback, pool = db) {
  pool.getConnection((connectionError, connection) => {
    if (connectionError) return callback(connectionError);
    const finish = (error, result) => {
      connection.release();
      callback(error, result);
    };
    const rollback = (error) => connection.rollback((rollbackError) => {
      if (rollbackError && error && typeof error === "object") error.rollbackError = rollbackError;
      finish(error);
    });

    connection.beginTransaction((beginError) => {
      if (beginError) return finish(beginError);
      work(connection, (workError, result) => {
        if (workError) return rollback(workError);
        connection.commit((commitError) => commitError ? rollback(commitError) : finish(null, result));
      });
    });
  });
}

module.exports = { withTransaction };
