const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const Keys = require("./keys");
const Cliente = require("../models/clientesModel");
const Usuario = require("../models/apiModel");

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Keys.secretOrKey,
    algorithms: Keys.algorithms || ["HS256"],
  };

  // Strategy for client authentication
  passport.use(
    "jwt-cliente",
    new JwtStrategy(opts, (jwt_payload, done) => {
      Cliente.getById(jwt_payload.id, (err, cliente) => {
        if (err) {
          return done(err, false);
        }
        if (cliente) {
          return done(null, cliente);
        } else {
          return done(null, false);
        }
      });
    })
  );

  // Strategy for user/admin authentication.
  // Service tokens are rejected until a dedicated service-auth design defines claims and scope.
  passport.use(
    "jwt-usuario",
    new JwtStrategy(opts, (jwt_payload, done) => {
      // Service tokens are intentionally not accepted at the user boundary.
      // Keep this isolated until a dedicated service-auth design defines claims and scope.
      if (jwt_payload.type === "service_token") {
        return done(null, false);
      }

      // Regular user token
      Usuario.getUserById(jwt_payload.id, (err, usuario) => {
        if (err) {
          return done(err, false);
        }
        if (usuario) {
          return done(null, usuario);
        } else {
          return done(null, false);
        }
      });
    })
  );
};
