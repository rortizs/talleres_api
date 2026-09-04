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
const ClientesModel = require("../../models/clientesModel");
const app = require("../../app");
const { request, withServer } = require("../helpers/http");

const originalAuthenticate = passport.authenticate;
passport.authenticate = () => (req, _res, next) => {
  req.user = { idClientes: 1, email: "client@example.com", rol: "cliente" };
  next();
};
after(() => { passport.authenticate = originalAuthenticate; });

const parseJson = (response) => JSON.parse(response.body);
function putJson(server, path, body) {
  const payload = JSON.stringify(body);
  return request(server, {
    path,
    method: "PUT",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    body: payload,
  });
}

test("PUT /api/v1/clientes/:id rejects forbidden fields before persistence", async (t) => {
  const originalEdit = ClientesModel.edit;
  const originalGetById = ClientesModel.getById;
  let editCalled = false;
  ClientesModel.edit = (_table, _data, _field, _id, callback) => {
    editCalled = true;
    callback(null, { affectedRows: 1 });
  };
  ClientesModel.getById = (_id, callback) => {
    callback(null, { idClientes: 42, nomeCliente: "Unsafe Client", email: "unsafe-client@example.com" });
  };
  t.after(() => {
    ClientesModel.edit = originalEdit;
    ClientesModel.getById = originalGetById;
  });

  await withServer(app, async (server) => {
    const response = await putJson(server, "/api/v1/clientes/42", {
      nomeCliente: "Unsafe Client",
      email: "unsafe-client@example.com",
      created_at: "2099-01-01T00:00:00.000Z",
    });
    const body = parseJson(response);
    assert.equal(response.statusCode, 400);
    assert.equal(editCalled, false);
    assert.equal(body.success, false);
    assert.equal(body.error.code, "VALIDATION_ERROR");
    assert.match(JSON.stringify(body.error.details), /created_at/);
  });
});
