function success(res, data = {}, options = {}) {
  const { statusCode = 200, message } = options;
  const body = {
    success: true,
    data,
  };

  if (message) {
    body.message = message;
  }

  return res.status(statusCode).json(body);
}

function fail(res, options = {}) {
  const {
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    message = "Internal server error",
    details = {},
  } = options;

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

module.exports = {
  success,
  fail,
};
