const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const { success } = require("./utils/apiResponse");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFoundHandler");
const app = express();

if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());
if (process.env.NODE_ENV !== "test") {
  require("./config/passport")(passport);
}
app.disable("x-powered-by");
app.get("/swagger.json", (_req, res) => {
  res.json(require("./swagger").specs);
});
app.use(express.static("public"));

app.get("/api/v1/health", (_req, res) => {
  success(res, { status: "ok" }, { message: "API is healthy" });
});

app.use("/api/v1", (_req, res, next) => {
  require("./routes/api")(_req, res, next);
});

if (process.env.NODE_ENV !== "test") {
  const swaggerRouter = require("./swagger");
  app.use("/api-docs", swaggerRouter);
}

app.get("/", (_req, res) => {
  res.send("Route point from backend server working");
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
