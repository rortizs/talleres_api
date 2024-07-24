const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const Keys = require("./keys");
const Cliente = require("../models/clientesModel");

module.exports = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // Utiliza Bearer Token
  opts.secretOrKey = Keys.secretOrKey;

  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      Cliente.getAllOsByClient(jwt_payload.id, (err, cliente) => {
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
};
