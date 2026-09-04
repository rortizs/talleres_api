const config = require("./env");

module.exports = {
  secretOrKey: config.jwt.secret,
  expiresIn: config.jwt.expiresIn,
  algorithms: config.jwt.algorithms,
};
