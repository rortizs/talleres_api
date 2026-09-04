process.env.NODE_ENV = "test";

const assert = require("node:assert/strict");
const { test } = require("node:test");

function getCreateRuntimeConfig() {
  const modulePath = require.resolve("../../config/env");
  delete require.cache[modulePath];
  return require("../../config/env").createRuntimeConfig;
}

function productionEnv(overrides = {}) {
  return {
    NODE_ENV: "production",
    HOST: "0.0.0.0",
    PORT: "3000",
    DB_HOST: "db.example.internal",
    DB_USER: "api_talleres",
    DB_PASSWORD: "example-db-password",
    DB_NAME: "api_talleres",
    JWT_SECRET: "production-jwt-secret-example-32chars-minimum",
    JWT_EXPIRES_IN: "1h",
    ...overrides,
  };
}

test("production config fails when JWT_SECRET is missing", () => {
  const createRuntimeConfig = getCreateRuntimeConfig();

  assert.throws(
    () => createRuntimeConfig(productionEnv({ JWT_SECRET: "" })),
    /JWT_SECRET is required in production/
  );
});

test("production config fails when required database values are missing", () => {
  const createRuntimeConfig = getCreateRuntimeConfig();

  assert.throws(
    () => createRuntimeConfig(productionEnv({ DB_NAME: "" })),
    /DB_NAME is required in production/
  );
});

test("production config fails when JWT_SECRET is too short for HMAC signing", () => {
  const createRuntimeConfig = getCreateRuntimeConfig();

  assert.throws(
    () => createRuntimeConfig(productionEnv({ JWT_SECRET: "short-secret" })),
    /JWT_SECRET must be at least 32 characters long/
  );
});

test("test config loads safe defaults without production credentials", () => {
  const createRuntimeConfig = getCreateRuntimeConfig();

  const config = createRuntimeConfig({ NODE_ENV: "test" });

  assert.equal(config.env, "test");
  assert.equal(config.isProduction, false);
  assert.deepEqual(config.server, {
    host: "127.0.0.1",
    port: "0",
  });
  assert.deepEqual(config.database, {
    host: "localhost",
    user: "root",
    password: "",
    database: "mapos_test",
  });
  assert.equal(config.jwt.secret.length >= 32, true);
  assert.equal(config.jwt.expiresIn, "1h");
});
