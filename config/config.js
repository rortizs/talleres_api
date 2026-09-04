const mysql = require("mysql2");
const config = require("./env");

/**
 * Pool de conexiones MySQL
 * 
 * Ventajas sobre createConnection:
 * - Reconecta automaticamente si la conexion se cierra
 * - Maneja multiples requests concurrentes
 * - Mas robusto para produccion
 */
const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  
  // Configuracion del pool
  waitForConnections: true,
  connectionLimit: 10,        // Maximo de conexiones simultaneas
  queueLimit: 0,              // Sin limite en la cola de espera
  enableKeepAlive: true,      // Mantener conexiones vivas
  keepAliveInitialDelay: 10000, // Ping cada 10 segundos
  
  // Reconexion automatica
  connectTimeout: 10000,      // Timeout de conexion: 10s
});

// Verificar conexion al iniciar
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Database connection was closed.');
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
      console.error('Database has too many connections.');
    }
    if (err.code === 'ECONNREFUSED') {
      console.error('Database connection was refused.');
    }
    return;
  }
  
  if (connection) {
    console.log("Connected to database successfully (Pool ID:", connection.threadId, ")");
    connection.release(); // Devolver conexion al pool
  }
});

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect...');
    // El pool reconectara automaticamente
  }
});

module.exports = pool;
