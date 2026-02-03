const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const Keys = require("./keys");
const Cliente = require("../models/clientesModel");
const Usuario = require("../models/apiModel");

module.exports = (passport) => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Keys.secretOrKey,
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

  // Strategy for user/admin authentication
  // Supports both regular users and service tokens
  passport.use(
    "jwt-usuario",
    new JwtStrategy(opts, (jwt_payload, done) => {
      // Service token - bypass user lookup
      if (jwt_payload.type === 'service_token') {
        return done(null, {
          idUsuarios: 0,
          nome: 'Service Account',
          email: jwt_payload.email,
          rol: 'service',
          isService: true
        });
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
