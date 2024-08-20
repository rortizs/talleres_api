const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

const authMiddleware = (req, res, next) => {
  const token = req.headers["autorization"];
  if (!token) return res.status(401).send({ message: "No token provided" });

  jwt.verify(token, keys.secretOrKey, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized" });
    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
