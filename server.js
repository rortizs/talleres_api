const http = require("http");
const config = require("./config/env");
const app = require("./app");

const PORT = config.server.port;
const HOST = config.server.host;

app.set("PORT", PORT);

const server = http.createServer(app);

server.listen(PORT, HOST, function () {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

module.exports = server;
