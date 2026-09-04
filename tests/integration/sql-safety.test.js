require("../helpers/testEnv");

const assert = require("node:assert/strict");
const { test } = require("node:test");

function loadModel(modulePath, queryImpl) {
  const modelPath = require.resolve(modulePath);
  const dbPath = require.resolve("../../config/config");
  delete require.cache[modelPath];
  require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query: queryImpl } };
  return require(modulePath);
}

const expectedLikePattern = (search) => `%${search.replace(/[\\%_]/g, "\\$&")}%`;

test("search queries escape SQL LIKE special characters and reject unsafe selectors", async () => {
  const search = "%_\\' OR 1=1 --";
  const subjects = [
    ["../../models/apiModel", ["usuarios", "*", search, 5, 0], [1, 2], ["usuarios; DROP", "*", "safe", 5, 0], /Unsupported table identifier/],
    ["../../models/clientesModel", ["clientes", "*", search, 5, 0], [1, 2, 3, 4, 5, 6], ["clientes", "idClientes, senha", "safe", 5, 0], /Unsupported column selector/],
  ];

  for (const [modulePath, args, patternIndexes, unsafeArgs, message] of subjects) {
    let captured;
    const model = loadModel(modulePath, (query, params, callback) => { captured = { query, params }; callback(null, []); });
    await new Promise((resolve, reject) => model.get(...args, (error) => error ? reject(error) : resolve()));
    assert.equal(captured.query.includes(search), false);
    assert.match(captured.query, /ESCAPE/);
    patternIndexes.forEach((index) => assert.equal(captured.params[index], expectedLikePattern(search)));
    await new Promise((resolve) => model.get(...unsafeArgs, (error) => { assert.match(error.message, message); resolve(); }));
  }
});
