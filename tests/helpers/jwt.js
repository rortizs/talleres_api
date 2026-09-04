const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");

function signUserToken(payload = {}, options = {}) {
  return jwt.sign(
    {
      id: 123,
      email: "user@example.com",
      nome: "Test User",
      rol: "usuario",
      ...payload,
    },
    keys.secretOrKey,
    {
      algorithm: "HS256",
      expiresIn: keys.expiresIn || "1h",
      ...options,
    }
  );
}

function signServiceToken(payload = {}, options = {}) {
  return jwt.sign(
    {
      type: "service_token",
      email: "service@example.com",
      ...payload,
    },
    keys.secretOrKey,
    {
      algorithm: "HS256",
      expiresIn: keys.expiresIn || "1h",
      ...options,
    }
  );
}

module.exports = {
  signServiceToken,
  signUserToken,
};
