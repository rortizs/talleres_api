const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const { fail } = require("../utils/apiResponse");

function unauthorized(res) {
  return fail(res, {
    statusCode: 401,
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    details: {},
  });
}

function extractBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const match = authHeader.match(/^Bearer ([^\s]+)$/);
  return match ? match[1] : null;
}

function buildAuthenticatedUser(decoded) {
  if (!decoded || decoded.type === "service_token" || !decoded.id) {
    return null;
  }

  return {
    id: decoded.id,
    email: decoded.email,
    nome: decoded.nome,
    rol: decoded.rol || "usuario",
  };
}

/**
 * Authentication middleware for JWT tokens.
 * Requires Authorization: Bearer <token> and maps verifier failures to a safe envelope.
 */
const authMiddleware = (req, res, next) => {
  const token = extractBearerToken(req.headers["authorization"]);

  if (!token) {
    return unauthorized(res);
  }

  jwt.verify(
    token,
    keys.secretOrKey,
    { algorithms: keys.algorithms || ["HS256"] },
    (err, decoded) => {
      if (err) {
        return unauthorized(res);
      }

      const user = buildAuthenticatedUser(decoded);
      if (!user) {
        return unauthorized(res);
      }

      req.user = user;
      return next();
    }
  );
};

module.exports = authMiddleware;
module.exports.extractBearerToken = extractBearerToken;
module.exports.buildAuthenticatedUser = buildAuthenticatedUser;
