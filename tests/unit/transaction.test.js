require("../helpers/testEnv");

const assert = require("node:assert/strict");
const { test } = require("node:test");

const dbPath = require.resolve("../../config/config");
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {} };

test("transaction helper exposes the transaction boundary", () => {
  const { withTransaction } = require("../../db/transaction");
  assert.equal(typeof withTransaction, "function");
});
