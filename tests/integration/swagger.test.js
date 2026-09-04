require("../helpers/testEnv");

const assert = require("node:assert/strict");
const express = require("express");
const { test } = require("node:test");
const swaggerRouter = require("../../swagger");
const app = require("../../app");
const { request, withServer } = require("../helpers/http");

test("Swagger UI responds without a production database", async () => {
  const docsApp = express();
  docsApp.use("/api-docs", swaggerRouter);

  await withServer(docsApp, async (server) => {
    const response = await request(server, { path: "/api-docs/" });

    assert.equal(response.statusCode, 200);
    assert.match(response.headers["content-type"], /text\/html/);
    assert.match(response.body, /Swagger UI/);
  });
});

test("/swagger.json serves the dynamic OpenAPI spec instead of the legacy static snapshot", async () => {
  await withServer(app, async (server) => {
    const response = await request(server, { path: "/swagger.json" });
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(body.servers.map((server) => server.url), [
      "https://api.taller.digicom.com.gt/api/v1",
      "http://localhost:3000/api/v1",
    ]);
    assert.equal(body.components.schemas.ApiErrorEnvelope.properties.success.enum[0], false);
  });
});

test("OpenAPI spec documents standardized envelopes, Bearer JWT auth, and supported servers", () => {
  const spec = swaggerRouter.specs;

  assert.equal(spec.openapi, "3.0.0");
  assert.deepEqual(
    spec.servers.map((server) => server.url),
    [
      "https://api.taller.digicom.com.gt/api/v1",
      "http://localhost:3000/api/v1",
    ]
  );
  assert.deepEqual(spec.security, [{ bearerAuth: [] }]);
  assert.equal(spec.components.securitySchemes.bearerAuth.type, "http");
  assert.equal(spec.components.securitySchemes.bearerAuth.scheme, "bearer");
  assert.equal(spec.components.securitySchemes.bearerAuth.bearerFormat, "JWT");
  assert.equal(spec.components.schemas.ApiSuccessEnvelope.properties.success.enum[0], true);
  assert.equal(spec.components.schemas.ApiErrorEnvelope.properties.success.enum[0], false);
  assert.equal(spec.components.schemas.ApiError.required.includes("code"), true);
  assert.equal(spec.components.schemas.ApiError.required.includes("message"), true);
  assert.deepEqual(spec.paths["/login"].post.security, []);
  assert.deepEqual(spec.paths["/clientes/login"].post.security, []);
});
