const AppError = require("../utils/AppError");

function notFoundHandler(req, _res, next) {
  next(
    new AppError("Route not found", 404, "NOT_FOUND", {
      path: req.originalUrl,
    })
  );
}

module.exports = notFoundHandler;
