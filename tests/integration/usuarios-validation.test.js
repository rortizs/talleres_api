require("../helpers/testEnv");

const assert = require("node:assert/strict");
const { after, test } = require("node:test");

const dbPath = require.resolve("../../config/config");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { query: () => { throw new Error("Unexpected database query in validation test"); } },
};

const passport = require("passport");
const ApiModel = require("../../models/apiModel");
const app = require("../../app");
const { request, withServer } = require("../helpers/http");

const originalAuthenticate = passport.authenticate;
passport.authenticate = () => (req, _res, next) => {
  req.user = { idUsuarios: 1, email: "admin@example.com", rol: "usuario" };
  next();
};
after(() => { passport.authenticate = originalAuthenticate; });

const parseJson = (response) => JSON.parse(response.body);
function jsonRequest(server, path, method, body) {
  const payload = JSON.stringify(body);
  return request(server, {
    path,
    method,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    body: payload,
  });
}

test("POST /api/v1/usuarios rejects forbidden fields before persistence", async (t) => {
  const originalAdd = ApiModel.add;
  const originalGetRowById = ApiModel.getRowById;
  let addCalled = false;
  ApiModel.add = (_table, _data, callback) => {
    addCalled = true;
    callback(null, { insertId: 44 });
  };
  ApiModel.getRowById = (_table, _field, _id, callback) => {
    callback(null, { idUsuarios: 44, nome: "Unsafe User", email: "unsafe@example.com" });
  };
  t.after(() => {
    ApiModel.add = originalAdd;
    ApiModel.getRowById = originalGetRowById;
  });

  await withServer(app, async (server) => {
    const response = await jsonRequest(server, "/api/v1/usuarios", "POST", {
      nome: "Unsafe User",
      email: "unsafe@example.com",
      senha: "secret123",
      permissoes_id: 99,
    });
    const body = parseJson(response);
    assert.equal(response.statusCode, 400);
    assert.equal(addCalled, false);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.match(JSON.stringify(body.error.details), /permissoes_id/);
  });
});

test("GET /api/v1/usuarios rejects invalid pagination and search values before querying", async (t) => {
  const originalGet = ApiModel.get;
  let getCalled = false;
  ApiModel.get = (_table, _columns, _search, _limit, _offset, callback) => {
    getCalled = true;
    callback(null, [{ idUsuarios: 1, nome: "Existing User" }]);
  };
  t.after(() => { ApiModel.get = originalGet; });

  await withServer(app, async (server) => {
    const response = await request(server, {
      path: `/api/v1/usuarios?perPage=0&page=-1&search=${"x".repeat(101)}`,
    });
    const body = parseJson(response);
    assert.equal(response.statusCode, 400);
    assert.equal(getCalled, false);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.match(JSON.stringify(body.error.details), /perPage|page|search/);
  });
});
