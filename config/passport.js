const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const Keys = require("./keys");
const Cliente = require("../models/clientesModel");
const Usuario = require("../models/apiModel");

module.exports = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
  opts.secretOrKey = Keys.secretOrKey;

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

  passport.use(
    "jwt-usuario",
    new JwtStrategy(opts, (jwt_payload, done) => {
      Usuario.getById(jwt_payload.id, (err, usuario) => {
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
