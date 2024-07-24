const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "10Br3nd@10",
  database: "mapos",
});

db.connect(function (err) {
  if (err) throw err;
  console.log("Connected to database, successfully");
});

module.exports = db;
