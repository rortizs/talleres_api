const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

/**
 * Authentication middleware for JWT tokens
 * Validates the Bearer token from Authorization header
 */
const authMiddleware = (req, res, next) => {
  // Fixed: was "autorization" (typo)
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(401).send({ message: "No token provided" });
  }

  // Support both "Bearer <token>" and raw token formats
  const token = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7) 
    : authHeader;

  jwt.verify(token, keys.secretOrKey, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized", error: err.message });
    }
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
