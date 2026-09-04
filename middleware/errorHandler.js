const { fail } = require("../utils/apiResponse");

function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;

  if (err.isOperational) {
    return fail(res, {
      statusCode,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  if (process.env.NODE_ENV !== "test") {
    console.error("Server error:", err);
  }

  return fail(res, {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
    details: {},
  });
}

module.exports = errorHandler;
