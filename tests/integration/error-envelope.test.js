require("../helpers/testEnv");

const assert = require("node:assert/strict");
const http = require("node:http");
const { test } = require("node:test");
const app = require("../../app");

function request(server, path) {
  const address = server.address();

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        method: "GET",
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

test("unknown routes return the standard not-found error envelope", async () => {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const response = await request(server, "/missing-resource");
    const body = JSON.parse(response.body);

    assert.equal(response.statusCode, 404);
    assert.equal(body.success, false);
    assert.deepEqual(body.error, {
      code: "NOT_FOUND",
      message: "Route not found",
      details: { path: "/missing-resource" },
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
