require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const swaggerRouter = require("./swagger");

/** Routes import */
const apiRouter = require("./routes/api");

// Server configuration from environment
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());
require("./config/passport")(passport);
app.disable("x-powered-by");
app.set("PORT", PORT);
app.use(express.static("public"));

/** Calling Routes */
app.use("/api/v1", apiRouter);
// Swagger
app.use("/api-docs", swaggerRouter);

server.listen(PORT, HOST, function () {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

/** Routes */
app.get("/", (req, res) => {
  res.send("Route point from backend server working");
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).send({
    message: err.message || "Internal server error",
    status: err.status || 500,
  });
});
