# Apply Progress: stabilize-api-talleres

## Slice 1 — Test harness and health baseline

Status: completed
Runtime reset: user authorized reset after the first Jest/Supertest attempt exceeded the 400-line budget through a generated lockfile update.

## Completed work

- Replaced the placeholder `npm test` script with Node's built-in `node --test` runner.
- Added `app.js` as an importable Express app boundary that does not listen on a port.
- Reduced `server.js` to dotenv loading, environment-driven `HOST`/`PORT`, HTTP server creation, and `server.listen`.
- Added `GET /api/v1/health` with a minimal alive response.
- Added the first integration test for the health endpoint using `node:test`, `node:assert/strict`, and `node:http`.
- Added `tests/helpers/testEnv.js` to set safe test runtime defaults before app import.
- Kept production Swagger, Passport, and API router initialization out of the health test import path so the health boundary does not require production services.
- Restored `package-lock.json` and tracked `node_modules` after the rejected oversized Jest/Supertest attempt.

## TDD evidence

### RED

1. Initial delegated attempt with Supertest:
   - `npm test -- tests/integration/health.test.js` failed because `../../app` did not exist.
   - After adding the app seam, the focused test failed with HTTP 404 for `GET /api/v1/health`.

2. Slim reset decision:
   - The generated Jest/Supertest lockfile exceeded the 400-line work-unit budget.
   - User authorized runtime reset and a slim implementation using Node's built-in test runner.

### GREEN

1. Command: `npm test`
   - Result: passed. 1 test suite passed, 1 test passed.

## Changed files

- `package.json`: replaced the placeholder test script with `node --test`.
- `app.js`: new importable Express app boundary and health endpoint.
- `server.js`: now only loads config and starts the HTTP listener.
- `tests/helpers/testEnv.js`: new test environment defaults.
- `tests/integration/health.test.js`: new native Node HTTP health endpoint test.
- `openspec/changes/stabilize-api-talleres/design.md`: updated test-harness design to use Node's built-in test runner for the foundation slice.
- `openspec/changes/stabilize-api-talleres/tasks.md`: checked off completed Slice 1 tasks only and removed the Jest/Supertest lockfile dependency from Slice 1.
- `openspec/changes/stabilize-api-talleres/apply-progress.md`: recorded Slice 1 implementation and verification evidence.

## Rollback boundary

Remove the Slice 1 test harness/app seam/health route work as one unit:

- restore the previous placeholder test script;
- remove `app.js`, `tests/helpers/testEnv.js`, and `tests/integration/health.test.js`;
- restore the previous `server.js` monolithic Express/listen setup;
- remove the Slice 1 checkbox updates and this progress entry.

## Slice 2 — Configuration fail-fast

Status: completed
Attempt token: `sha256:8ad8f2e97e32f1411508f4cda025decac4acf60f783fbac45dc7e44974be3b95` (acquired by parent; parent owns settle).

## Completed work

- Added `tests/unit/env.test.js` with production fail-fast coverage for missing `JWT_SECRET`, missing required DB values, weak `JWT_SECRET`, and test-mode safe defaults.
- Added `config/env.js` as the centralized runtime configuration module with grouped `server`, `database`, and `jwt` exports.
- Enforced required production `PORT`, DB values, and `JWT_SECRET`.
- Enforced a minimum 32-character `JWT_SECRET` for HMAC signing.
- Refactored `server.js`, `config/config.js`, and `config/keys.js` to consume centralized config.
- Replaced `.env.example` with a sanitized placeholder-only template; no real secrets or host-specific credentials were preserved.

## TDD evidence

### RED

- Command: `npm test -- tests/unit/env.test.js`
- Result: failed as expected before implementation because `config/env.js` did not exist (`MODULE_NOT_FOUND`).

### GREEN

- Command: `npm test -- tests/unit/env.test.js`
- Result: passed. 4 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 5 tests passed, 0 failed.

## Rollback boundary

Remove the Slice 2 configuration fail-fast work as one unit:

- remove `config/env.js` and `tests/unit/env.test.js`;
- restore `server.js`, `config/config.js`, and `config/keys.js` to direct environment-variable/default handling;
- remove the sanitized `.env.example` replacement if rolling back documentation with the behavior;
- revert the Slice 2 checkbox updates and this progress entry.

## Remaining work

- Slice 3: standard response and error envelope, including updating health to the final success envelope.
- Later slices: auth hardening, validation, SQL safety/transactions, Swagger alignment, CI, deployment guardrails, and final release readiness.

## Notes and risks

- `node_modules` is tracked in the repository despite `.gitignore`; avoid package installation in small review-budget slices unless explicitly isolated.
- Existing dependency audit reported 15 vulnerabilities during the rejected Jest/Supertest attempt. No audit fix was run because dependency remediation is outside Slice 1.
- Slice 3 not-found testing intentionally uses a non-API unknown path so the test exercises the standard 404 envelope without loading DB-backed route controllers.
- Parent normalized unused Express callback parameters in `app.js` after Slice 7 LSP hints; `npm test` still passes 21/21 and `app.js` LSP diagnostics are clean.

## Slice 3 — Standard response and error foundation

Status: completed
Attempt token: `sha256:ae83727e214678b5b0d3b87df918bc678394b10e8de0b10ebcccd37ac08fb546` (acquired by parent; parent owns settle).

## Completed work

- Added response-envelope assertions for `GET /api/v1/health` using the standard success envelope.
- Added an integration test proving unknown API routes return the standard not-found error envelope.
- Added `utils/apiResponse.js` with shared `success` and `fail` helpers.
- Added `utils/AppError.js` for operational application errors.
- Added centralized `middleware/errorHandler.js` and `middleware/notFoundHandler.js`.
- Updated the health route to return `{ success: true, data, message }` through the shared success helper.
- Replaced the previous inline Express error response with the shared not-found and error middleware.

## TDD evidence

### RED

- Command: `npm test -- tests/integration/health.test.js tests/integration/error-envelope.test.js`
- Result: failed as expected before implementation. The not-found test received an HTML response that could not be parsed as JSON, and the health test saw `success` as `undefined` instead of `true`.

### GREEN

- Command: `npm test -- tests/integration/health.test.js tests/integration/error-envelope.test.js`
- Result: passed. 2 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 6 tests passed, 0 failed.

## Rollback boundary

Remove the Slice 3 response/error foundation as one unit:

- remove `utils/apiResponse.js`, `utils/AppError.js`, `middleware/errorHandler.js`, `middleware/notFoundHandler.js`, and `tests/integration/error-envelope.test.js`;
- restore the health route response to the previous minimal body if rolling back the standardized success envelope;
- restore the previous inline Express error handler in `app.js`;
- remove the Slice 3 checkbox updates and this progress entry.

## Remaining work update

- Slice 4 and later remain: auth hardening, validation, SQL safety/transactions, Swagger alignment, CI, deployment guardrails, and final release readiness.

## Slice 4 — Auth/JWT hardening

Status: completed
Attempt token: `sha256:8b1d6aff20299eaef509376a8787993ed54cbfba853a25bcd16d129cd6217989` (acquired by parent; parent owns settle).

## Completed work

- Added auth integration coverage for missing token, raw Authorization token, invalid JWT, valid Bearer user token, non-allowlisted signing algorithms, and service-token rejection.
- Added reusable native HTTP and JWT test helpers for auth-boundary tests.
- Updated `authMiddleware` to require `Authorization: Bearer <token>` only, verify JWTs with the configured algorithm allowlist, map auth failures to the standard `UNAUTHORIZED` envelope, and reject service tokens at the user boundary.
- Updated `/api/v1/me` to return the authenticated token principal through the standard success envelope without requiring a database-backed fixture.
- Added explicit `HS256` signing to user login tokens and included `nome` in the user token payload used by `/me`.
- Updated Passport JWT strategy options to constrain algorithms and isolated existing service-token bypass behavior by rejecting service tokens from `jwt-usuario` until a dedicated service-auth design exists.

## TDD evidence

### RED

- Command: `npm test -- tests/integration/auth.test.js`
- Result: failed as expected before implementation. All 6 new auth tests failed: missing/invalid token responses did not use the standard envelope, raw/non-allowlisted/service tokens reached unsafe behavior or 500s, and valid `/me` required the database-backed lookup instead of returning the authenticated principal.

### GREEN

- Command: `npm test -- tests/integration/auth.test.js`
- Result: passed. 6 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 12 tests passed, 0 failed.

## Service-token decision

Service tokens are isolated for removal at the user authentication boundary. The previous `jwt-usuario` Passport bypass now rejects `type: "service_token"`, and `/api/v1/me` rejects service tokens with the standard `UNAUTHORIZED` envelope. A future dedicated service-auth design can reintroduce service tokens with explicit claims, scope, and tests.

## Rollback boundary

Remove the Slice 4 auth hardening work as one unit:

- remove `tests/integration/auth.test.js`, `tests/helpers/http.js`, and `tests/helpers/jwt.js` if rolling back the added auth test boundary;
- restore `middleware/authMiddleware.js` to its previous JWT parsing behavior;
- restore `config/passport.js` service-token bypass and unconstrained strategy options only if reverting the hardening decision;
- restore `/api/v1/me` to the previous database-backed response shape in `controllers/usuariosController.js`;
- remove the Slice 4 checkbox updates and this progress entry.

## Remaining work update

- Slice 5 and later remain: validation and mass-assignment controls, SQL safety/transactions, Swagger alignment, CI, deployment guardrails, and final release readiness.

## Slice 5 — User/client validation and mass-assignment controls

Status: completed
Attempt token: `sha256:568f08685de90a855929218c7f56c95a6d2662720d34984600f538125ab0d63b` (acquired by parent; parent owns settle).

## Completed work

- Added integration validation coverage proving forbidden user fields are rejected before `ApiModel.add` can persist them.
- Added integration validation coverage proving forbidden client fields are rejected before `ClientesModel.edit` can persist them.
- Added integration validation coverage proving invalid `perPage`, `page`, and overlong `search` query values are rejected before `ApiModel.get` can query.
- Added lightweight validators with explicit user and client write-field allowlists.
- Updated user create/update and client create/update controller paths to validate request bodies before model writes and persist only allowlisted data.
- Updated user/client list controller paths to normalize bounded pagination and search values.
- Returned standardized `VALIDATION_ERROR` envelopes for validation failures.

## TDD evidence

### RED

- Command: `npm test -- tests/integration/usuarios-validation.test.js tests/integration/clientes-validation.test.js`
- Result: failed as expected before implementation. The forbidden client field test returned `200` instead of `400`, the forbidden user field test returned `201` instead of `400`, and the invalid pagination/search test returned `200` instead of `400`.

### GREEN

- Command: `npm test -- tests/integration/usuarios-validation.test.js tests/integration/clientes-validation.test.js`
- Result: passed. 3 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 15 tests passed, 0 failed. Output still included the pre-existing test-mode database connection log from route/controller imports.

## Rollback boundary

Remove the Slice 5 validation and mass-assignment work as one unit:

- remove `validators/common.js`, `validators/usuarios.js`, and `validators/clientes.js`;
- remove `tests/integration/usuarios-validation.test.js` and `tests/integration/clientes-validation.test.js`;
- restore user/client create/update controller paths to their previous raw body persistence behavior only if rolling back this security control;
- restore user/client list pagination parsing to the previous inline parsing;
- remove the Slice 5 checkbox updates and this progress entry.

## Remaining work update

- Slice 6 and later remain: SQL safety/transactions, Swagger alignment, CI, deployment guardrails, and final release readiness.

## Slice 6 — SQL safety and transaction boundary

Status: completed
Attempt token: `sha256:a430c8373261114fb0d3f919b2a7234980d47efbbe061ca72740cdd2cf751fed` (acquired by parent; parent owns settle).
Selected transaction workflow: `PUT /api/v1/cotizaciones/:id/aprobar`.

## Completed work

- Added SQL-safety coverage for user and client search terms containing SQL LIKE special characters and injection-shaped text.
- Added coverage proving unsafe dynamic table/column selectors are rejected before query execution.
- Added a transaction helper that begins, commits, rolls back on work/commit failure, and releases pooled connections.
- Refactored quotation approval to run the quotation update and service-order total update inside one transaction.
- Changed quotation approval to rollback and return a server error if the service-order update fails, instead of swallowing the error after approving the quotation.
- Added focused transaction workflow coverage for rollback on service-order update failure.

## TDD evidence

### RED

- Command: `npm test -- tests/integration/sql-safety.test.js tests/unit/transaction.test.js tests/integration/transactions.test.js`
- Result: failed as expected before implementation. SQL-safety tests failed because search queries did not include an `ESCAPE` clause; the transaction workflow test returned `200` instead of `500` and did not rollback; the transaction helper unit test failed because `db/transaction.js` did not exist.

### GREEN

- Command: `npm test -- tests/integration/sql-safety.test.js tests/unit/transaction.test.js tests/integration/transactions.test.js`
- Result: passed. 3 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 18 tests passed, 0 failed. Output still included the pre-existing test-mode database connection log from route/controller imports.

## Rollback boundary

Remove the Slice 6 SQL safety and transaction boundary work as one unit:

- remove `db/transaction.js`, `tests/integration/sql-safety.test.js`, `tests/unit/transaction.test.js`, and `tests/integration/transactions.test.js`;
- restore `models/apiModel.js` and `models/clientesModel.js` to their previous dynamic selector behavior only if rolling back this security control;
- restore `controllers/cotizacionesController.js` approval flow to the previous non-transactional nested queries;
- remove the Slice 6 checkbox updates and this progress entry.

## Remaining work update

- Slice 7 and later remain: Swagger/OpenAPI alignment, CI, deployment guardrails, and final release readiness.

## Slice 7 — Swagger/OpenAPI alignment

Status: completed
Attempt token: `sha256:bde1791c336f253e3ffe31aca6c606ccb67d35840c6989b74e5369750caaa226` (acquired by parent; parent owns settle).
Swagger source-of-truth decision: route annotations plus `swagger.js` are the dynamic runtime documentation source of truth. The generated `swagger.json` and `public/swagger.json` snapshots are not regenerated in this slice because regenerating the JSON snapshot produced a large generated diff that would exceed the 400-line slice budget.

## Completed work

- Added integration coverage proving Swagger UI responds without a production database.
- Added integration coverage proving `/swagger.json` serves the dynamic OpenAPI spec instead of the legacy static generated snapshot.
- Added integration coverage proving OpenAPI documents standard success/error envelope schemas, Bearer JWT auth, unauthenticated login exceptions, and HTTPS production plus local development servers.
- Centralized Swagger generation through `swagger.js` so `generateSwagger.js` writes the same spec served by Swagger UI when a generated snapshot is intentionally refreshed in a later slice.
- Added shared OpenAPI schemas for `ApiSuccessEnvelope`, `ApiErrorEnvelope`, and `ApiError`.
- Added the Bearer JWT security scheme and default OpenAPI security requirement.
- Documented user and client login routes as unauthenticated exceptions to the default Bearer JWT requirement.
- Updated documented servers to prefer `https://api.taller.digicom.com.gt/api/v1` and keep `http://localhost:3000/api/v1` for local development.
- Fixed the malformed `/me` Swagger annotation and documented its standard envelope responses.
- Added a dynamic `/swagger.json` runtime response before static file serving so stale generated snapshots are not the runtime docs source.
- Left generated JSON snapshots untouched to avoid a large generated diff in this review slice.

## TDD evidence

### RED

- Command: `npm test -- tests/integration/swagger.test.js`
- Result: failed as expected before implementation. Swagger UI responded, but the OpenAPI assertion failed because `swaggerRouter.specs` was undefined; the run also exposed the pre-existing malformed `/me` Swagger annotation warnings.
- Command: `npm test -- tests/integration/swagger.test.js`
- Result: failed as expected for the dynamic source-of-truth route before the app change. `/swagger.json` returned the legacy static snapshot with the insecure HTTP production URL instead of the dynamic spec.
- Command: `npm test -- tests/integration/swagger.test.js`
- Result: failed as expected for unauthenticated login documentation before route annotation updates. `/login` inherited default Bearer security instead of declaring `security: []`.

### GREEN

- Command: `npm test -- tests/integration/swagger.test.js`
- Result: passed. 3 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 21 tests passed, 0 failed. Output still included the pre-existing test-mode database connection log from route/controller imports.

## Rollback boundary

Remove the Slice 7 Swagger/OpenAPI alignment work as one unit:

- remove `tests/integration/swagger.test.js`;
- restore `swagger.js` and `generateSwagger.js` to their previous duplicated Swagger configuration;
- remove the dynamic `/swagger.json` app route;
- restore the previous `/me` Swagger annotation in `routes/api.js` only if rolling back the OpenAPI parser cleanup;
- keep the generated JSON snapshots unchanged unless a later generated-artifact slice intentionally refreshes them;
- remove the Slice 7 checkbox updates and this progress entry.

## Remaining work update

- Slice 8 and later remain: CI, deployment guardrails, generated Swagger snapshot/check decision, and final release readiness.

## Slice 8 — GitHub Actions CI

Status: completed
Attempt token: `sha256:a54bc89e7ff36d80c8f3758b287d98eb27b9d1ac621d22371db1714d6bc4f5b0` (acquired by parent; parent owns settle).

## Completed work

- Added a baseline CI workflow at `.github/workflows/ci.yml` for pull requests and pushes to `main`.
- Set workflow-level permissions to `contents: read`.
- Used `actions/setup-node@v4` with Node.js `20.x` and npm cache support.
- Configured the workflow to run `npm ci` followed by `npm test` on a clean GitHub-hosted runner.
- Omitted a MySQL service container because deterministic CI-ready E2E fixtures are not ready yet.
- Avoided secret interpolation in shell `run` blocks; the workflow does not require secrets.
- Added a CI concurrency group that cancels superseded PR builds.
- Documented the CI workflow and local validation note in `README.md`, including why local `npm ci` was not run in this tracked-`node_modules` working tree.

## Config-first validation evidence

### RED

- Command: `test -f .github/workflows/ci.yml`
- Result: failed with exit code 1 before implementation because the CI workflow file did not exist.

### GREEN

- Command: `node <<'NODE' ... NODE`
- Result: passed. Parsed `.github/workflows/ci.yml` with `js-yaml` and asserted CI triggers, `contents: read`, PR concurrency, Node/npm cache setup, `npm ci`, `npm test`, no MySQL service, and no direct secret interpolation in shell run blocks.
- Command: `npm test`
- Result: passed. 21 tests passed, 0 failed. Output still included the pre-existing test-mode database connection log from route/controller imports.

## Rollback boundary

Remove the Slice 8 CI workflow work as one unit:

- remove `.github/workflows/ci.yml`;
- remove the README CI section;
- revert the Slice 8 checkbox updates and this progress entry.

## Remaining work update

- Slice 9 and later remain: production deployment guardrails, generated Swagger snapshot/check decision, and final integrated verification/release readiness.

## Slice 9 — Production deploy automation for Digicom LXC 101

Status: completed
Attempt token: `sha256:c4a6e8faeda33818f35de7fd8aadabeed150acdc064468cd6b512f55e8a60bf5` (acquired by parent; parent owns settle).
Process manager decision: PM2 is selected because the SDD design prefers PM2 unless current production proves otherwise, and this slice intentionally did not execute production inspection commands.

## Completed work

- Added a protected production deployment workflow at `.github/workflows/deploy.yml` using the `production` GitHub environment and a `production-lan` self-hosted runner label.
- Added a CI gate that queries the GitHub Actions `CI` workflow and refuses deployment unless the exact deployment SHA already has a successful completed CI run.
- Defined the required production deployment secrets in workflow environment wiring and documentation without printing their values: `PROD_SSH_HOST`, `PROD_SSH_PORT`, `PROD_SSH_USER`, `PROD_SSH_KEY`, and `PROD_APP_PATH`.
- Added `scripts/deploy-production.sh` to execute deployment through Proxmox into LXC 101, refuse dirty production trees, reset to the approved commit, install dependencies with `npm ci --omit=dev`, restart PM2, and smoke-check `/api/v1/health`.
- Added `ecosystem.config.js` for PM2 production reloads.
- Added `docs/deployment.md` and a README deployment summary with rollback instructions and infrastructure boundaries.
- Kept Caddy, Proxmox host configuration, MikroTik rules, database schema, and production LXC execution out of this slice.

## Config-first validation evidence

### RED

- Command: `test -f .github/workflows/deploy.yml && test -f scripts/deploy-production.sh`
- Result: failed with exit code 1 before implementation because the deployment workflow and script did not exist.

### GREEN

- Command: `bash -n scripts/deploy-production.sh && DEPLOY_SHA=0000000000000000000000000000000000000000 PROD_SSH_HOST=example.invalid PROD_SSH_PORT=22 PROD_SSH_USER=deploy PROD_APP_PATH=app-path-placeholder scripts/deploy-production.sh --dry-run`
- Result: passed. The dry run validated required inputs and explicitly reported that no SSH, production process, Caddy, Proxmox, MikroTik, or database command was executed.
- Command: `node <<'NODE' ... NODE`
- Result: passed. Parsed `.github/workflows/deploy.yml` and asserted workflow dispatch, least-privilege permissions, production environment, Digicom LAN runner label, CI success gate, script syntax validation, secret env wiring, no direct secret interpolation in run blocks, LXC 101 command path, dirty-tree guard, `npm ci --omit=dev`, PM2 restart, health smoke check, and no Caddy LXC command.
- Command: `npm test`
- Result: passed. 21 tests passed, 0 failed. Output still included the pre-existing test-mode database connection log from route/controller imports.

## Rollback boundary

Remove the Slice 9 deployment automation as one unit:

- remove `.github/workflows/deploy.yml`, `scripts/deploy-production.sh`, `ecosystem.config.js`, and `docs/deployment.md`;
- remove the README production deployment section;
- revert the Slice 9 checkbox updates and this progress entry.

## Remaining work update

- Slice 10 remains: integrated verification and release readiness, including clean checkout `npm ci`, full tests, CI evidence, RDD/review gate validation, production clean-tree confirmation, and final rollback accuracy review.

## Slice 10 — Local release readiness checkpoint

Status: partial-blocked

### Completed local checks

- `npm test`: passed with 21 tests, 21 pass.
- `bash -n scripts/deploy-production.sh`: passed.
- Deployment dry run: passed with no SSH, production process, Caddy, Proxmox, MikroTik, or database command executed.
- `git diff --check`: passed.
- Swagger runtime/spec checks are covered by the passing `tests/integration/swagger.test.js` tests.
- Rollback instructions were checked against `scripts/deploy-production.sh` and `docs/deployment.md`.
- RDD mode status: receipt-driven development is on globally.

### External blockers before final verify/archive/merge

- `npm ci` from a clean checkout/worktree has not been run because the current change is not committed into a clean checkout yet, and this repository tracks `node_modules`.
- Isolated MySQL E2E fixtures are not ready yet.
- CI cannot be green until the PR chain is pushed and GitHub Actions runs.
- RDD/review receipt gates have not been validated for delivery.
- LXC 101 deploy target is still dirty: read-only LAN check showed the production target is dirty with unresolved conflicts and many deleted tracked files.
- No merge to `main` has been performed.

### Production read-only check

Command shape used from LAN Digicom:

```bash
ssh -i <ssh-key-path> -p 22 <ssh-user>@<PROXMOX_LAN_HOST> "pct exec 101 -- bash -lc 'su -s /bin/bash www-data -c ...'"
```

Result: production target is not clean and remains unsafe for automated deployment until cleaned or replaced by an approved recovery/deploy plan.


## Slice 7/8 — Swagger snapshot CI check

Status: completed-local
Attempt token: `sha256:d233f50084de936aa607562bf5223c86962ebf74e809a42a18cf6c40d68c41ca` (acquired by parent; parent owns settle).

### Completed work

- Added `swagger:generate` and `swagger:check` npm scripts.
- Updated `generateSwagger.js` so generation writes both committed Swagger snapshots: `swagger.json` and `public/swagger.json`.
- Added `--check` mode that compares both committed snapshots against the dynamic OpenAPI spec in memory and exits non-zero when either snapshot is missing or stale.
- Refreshed `swagger.json` and `public/swagger.json` from the dynamic spec so the new check can pass.
- Updated CI to run `npm run swagger:check` after `npm ci` and before `npm test`.
- Marked only the locally proven Slice 7 Swagger CI check task complete. External gates remain unchecked.

### TDD/config-check evidence

#### RED

- Command: `npm run swagger:check`
- Result: failed with exit code 1 before implementation because `package.json` did not define a `swagger:check` script. npm also wrote its normal missing-script debug log outside this worktree under the configured npm cache.

#### GREEN

- Command: `npm run swagger:check`
- Result: failed after adding the script, proving the check detected stale committed snapshots: `swagger.json` and `public/swagger.json`.
- Command: `npm run swagger:generate`
- Result: passed and generated `swagger.json` plus `public/swagger.json`.
- Command: `npm run swagger:check`
- Result: passed with `Swagger snapshots are up to date.`
- Command: `npm test -- tests/integration/swagger.test.js`
- Result: passed. 3 tests passed, 0 failed.
- Command: `npm test`
- Result: passed. 21 tests passed, 0 failed. Output still included the pre-existing test-mode database connection log from route/controller imports.
- Command: `node <<'NODE' ... NODE`
- Result: passed. Parsed `.github/workflows/ci.yml` and asserted pull request/main triggers, `contents: read`, PR concurrency, `npm ci`, `npm run swagger:check`, `npm test`, and no direct secret interpolation.

### Rollback boundary

Remove this Swagger snapshot check work as one unit:

- remove `swagger:generate` and `swagger:check` from `package.json`;
- restore `generateSwagger.js` to the previous single-file generator if generated snapshot checks are abandoned;
- remove the CI `npm run swagger:check` step;
- revert the generated `swagger.json` and `public/swagger.json` refresh;
- revert the Slice 7 checkbox update and this progress entry.

### Remaining blockers

- Clean-checkout `npm ci`, isolated MySQL E2E, PR CI, RDD/review receipt gates, LXC 101 clean-tree confirmation, PR approval, and merge to `main` are still not locally proven and remain unchecked.

### Size exception

User approved preserving the generated Swagger snapshot refresh as a size exception after local verification passed. Native SDD attempt recorded 1,276 changed lines for the Swagger snapshot check work because `swagger.json` and `public/swagger.json` were regenerated from the dynamic OpenAPI spec.

Evidence:

- `npm run swagger:check`: passed with snapshots up to date.
- `npm test`: passed with 21/21 tests.
- `git diff --check` on the allowed surfaces: passed with no output.
- Native blocked attempt evidence revision: `sha256:66453f3253191bb978489b11db34b675f8c2e6449d3223f0968a10941839205b`.

## Slice 10 — Local policy task closure

Status: completed-local
Attempt token: `sha256:2cca78c244701c7bb248af20a7c9f0256e9895ec8e754a95dc1c6b1fad900f38` (acquired by parent; parent owns settle).

### Completed work

- Confirmed the active tracker branch/worktree is `sdd/stabilize-api-talleres`.
- Confirmed foundational slices were performed sequentially before later docs/Swagger/CI/deploy-planning work.
- Marked the parallel-worktree policy statements complete as policy constraints for any follow-up worktree split.

### Evidence

- `git branch --show-current`: `sdd/stabilize-api-talleres`.
- `grep -n '^- [ ]' openspec/changes/stabilize-api-talleres/tasks.md`: remaining unchecked tasks are external delivery/readiness gates only.

### Remaining blockers

- Isolated PR-slice worktrees have not been created yet.
- Clean-checkout `npm ci`, isolated MySQL E2E, PR CI, RDD/review receipt gates, LXC 101 clean-tree confirmation, PR approval, and merge to `main` are still not proven.
