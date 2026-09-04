require("../helpers/testEnv");

const assert = require("node:assert/strict");
const { after, test } = require("node:test");

const queryLog = [];
const state = { rollbackCalled: false, commitCalled: false, releaseCalled: false };
function handleQuery(query, params, callback) {
  queryLog.push({ query, params });
  if (/SELECT \* FROM cotizaciones/i.test(query)) return callback(null, [{ estado: "enviada", total: 125.5, monto_anticipo: 75.3, os_id: 9 }]);
  if (/UPDATE cotizaciones SET/i.test(query)) return callback(null, { affectedRows: 1 });
  if (/UPDATE os SET/i.test(query)) return callback(new Error("order update failed"));
  return callback(null, { affectedRows: 0 });
}

const dbPath = require.resolve("../../config/config");
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query: handleQuery, getConnection: (callback) => callback(null, {
  query: handleQuery,
  beginTransaction: (callback) => callback(null),
  commit: (callback) => { state.commitCalled = true; callback(null); },
  rollback: (callback) => { state.rollbackCalled = true; callback(null); },
  release: () => { state.releaseCalled = true; },
}) } };

const passport = require("passport");
const originalAuthenticate = passport.authenticate;
passport.authenticate = () => (req, _res, next) => { req.user = { idUsuarios: 1 }; next(); };
after(() => { passport.authenticate = originalAuthenticate; });

const app = require("../../app");
const { request, withServer } = require("../helpers/http");

test("PUT /api/v1/cotizaciones/:id/aprobar rolls back when the order update fails", async () => {
  await withServer(app, async (server) => {
    const body = JSON.stringify({ aprobado_por: "Cliente Example" });
    const response = await request(server, { path: "/api/v1/cotizaciones/7/aprobar", method: "PUT", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, body });
    assert.equal(response.statusCode, 500);
    assert.equal(JSON.parse(response.body).message, "Error del servidor");
    assert.equal(state.rollbackCalled, true);
    assert.equal(state.commitCalled, false);
    assert.equal(state.releaseCalled, true);
    assert.equal(queryLog.some(({ query }) => /UPDATE cotizaciones SET/i.test(query)), true);
  });
});
