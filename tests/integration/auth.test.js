require("../helpers/testEnv");

const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { test } = require("node:test");
const app = require("../../app");
const keys = require("../../config/keys");
const { request, withServer } = require("../helpers/http");
const { signServiceToken, signUserToken } = require("../helpers/jwt");

function parseJson(response) {
  return JSON.parse(response.body);
}

function assertUnauthorizedEnvelope(response) {
  const body = parseJson(response);

  assert.equal(response.statusCode, 401);
  assert.equal(body.success, false);
  assert.deepEqual(body.error, {
    code: "UNAUTHORIZED",
    message: "Unauthorized",
    details: {},
  });
}

test("GET /api/v1/me without a token returns the standard unauthorized envelope", async () => {
  await withServer(app, async (server) => {
    const response = await request(server, { path: "/api/v1/me" });

    assertUnauthorizedEnvelope(response);
  });
});

test("GET /api/v1/me rejects a raw token Authorization header", async () => {
  await withServer(app, async (server) => {
    const token = signUserToken();
    const response = await request(server, {
      path: "/api/v1/me",
      headers: { Authorization: token },
    });

    assertUnauthorizedEnvelope(response);
  });
});

test("GET /api/v1/me does not leak JWT internals for an invalid token", async () => {
  await withServer(app, async (server) => {
    const response = await request(server, {
      path: "/api/v1/me",
      headers: { Authorization: "Bearer not-a-valid-token" },
    });
    const body = parseJson(response);

    assertUnauthorizedEnvelope(response);
    assert.doesNotMatch(JSON.stringify(body), /jwt|JsonWebTokenError|malformed|signature/i);
  });
});

test("GET /api/v1/me accepts a valid Bearer user token", async () => {
  await withServer(app, async (server) => {
    const token = signUserToken({ id: 456, email: "valid@example.com", nome: "Valid User" });
    const response = await request(server, {
      path: "/api/v1/me",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = parseJson(response);

    assert.equal(response.statusCode, 200);
    assert.equal(body.success, true);
    assert.deepEqual(body.data, {
      id: 456,
      email: "valid@example.com",
      nome: "Valid User",
      rol: "usuario",
    });
  });
});

test("GET /api/v1/me rejects user tokens signed with non-allowlisted algorithms", async () => {
  await withServer(app, async (server) => {
    const token = jwt.sign(
      { id: 789, email: "invalid-alg@example.com", rol: "usuario" },
      keys.secretOrKey,
      { algorithm: "HS384", expiresIn: "1h" }
    );
    const response = await request(server, {
      path: "/api/v1/me",
      headers: { Authorization: `Bearer ${token}` },
    });

    assertUnauthorizedEnvelope(response);
  });
});

test("GET /api/v1/me rejects service tokens at the user auth boundary", async () => {
  await withServer(app, async (server) => {
    const token = signServiceToken();
    const response = await request(server, {
      path: "/api/v1/me",
      headers: { Authorization: `Bearer ${token}` },
    });

    assertUnauthorizedEnvelope(response);
  });
});
