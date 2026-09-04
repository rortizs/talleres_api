const dotenv = require("dotenv");

const DEFAULT_JWT_SECRET = "local-test-jwt-secret-not-for-production-only";
const JWT_SECRET_MIN_LENGTH = 32;

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function getValue(env, key, fallback) {
  return isBlank(env[key]) ? fallback : String(env[key]);
}

function requireProductionValue(env, key) {
  if (isBlank(env[key])) {
    throw new Error(`${key} is required in production`);
  }
  return String(env[key]);
}

function validateJwtSecret(secret, isProduction) {
  if (secret.length < JWT_SECRET_MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${JWT_SECRET_MIN_LENGTH} characters long`
    );
  }

  if (isProduction && secret === DEFAULT_JWT_SECRET) {
    throw new Error("JWT_SECRET must not use the local/test default in production");
  }
}

function createRuntimeConfig(env = process.env) {
  const nodeEnv = getValue(env, "NODE_ENV", "development");
  const production = nodeEnv === "production";
  const test = nodeEnv === "test";

  const host = production
    ? getValue(env, "HOST", "0.0.0.0")
    : getValue(env, "HOST", test ? "127.0.0.1" : "0.0.0.0");
  const port = production
    ? requireProductionValue(env, "PORT")
    : getValue(env, "PORT", test ? "0" : "3000");

  const database = production
    ? {
        host: requireProductionValue(env, "DB_HOST"),
        user: requireProductionValue(env, "DB_USER"),
        password: requireProductionValue(env, "DB_PASSWORD"),
        database: requireProductionValue(env, "DB_NAME"),
      }
    : {
        host: getValue(env, "DB_HOST", "localhost"),
        user: getValue(env, "DB_USER", "root"),
        password: getValue(env, "DB_PASSWORD", ""),
        database: getValue(env, "DB_NAME", test ? "mapos_test" : "mapos"),
      };

  const jwtSecret = production
    ? requireProductionValue(env, "JWT_SECRET")
    : getValue(env, "JWT_SECRET", DEFAULT_JWT_SECRET);
  validateJwtSecret(jwtSecret, production);

  return {
    env: nodeEnv,
    isProduction: production,
    isTest: test,
    server: {
      host,
      port,
    },
    database,
    jwt: {
      secret: jwtSecret,
      expiresIn: getValue(env, "JWT_EXPIRES_IN", "1h"),
      algorithms: ["HS256"],
    },
  };
}

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

const runtimeConfig = createRuntimeConfig(process.env);

module.exports = runtimeConfig;
module.exports.createRuntimeConfig = createRuntimeConfig;
