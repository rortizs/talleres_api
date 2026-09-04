# Tasks: Stabilize API Talleres

## Review Workload Forecast

- Chained PRs recommended: Yes
- 400-line budget risk: High
- Estimated changed lines: >400 across the full stabilization
- Decision needed before apply: Yes — chain strategy must be confirmed before implementation starts
- Recommended chain strategy: feature-branch-chain, because standardized API envelopes may be breaking and should integrate behind a coordinated tracker branch before final merge to `main`
- E2E required: Yes
- RDD required: Yes, receipt-driven development is enabled by user request

## Worktree and branch plan

- [x] Create/keep tracker branch: `sdd/stabilize-api-talleres`
- [ ] Use one isolated worktree per independent PR slice only after dependencies are clear
- [x] Keep foundational slices sequential:
  - test harness and app seam
  - config fail-fast
  - response/auth foundation
- [ ] Do not merge to `main` until CI/E2E and RDD/review gates pass

## Slice 1 — Test harness and health baseline

**Goal:** Establish a real automated test boundary before changing behavior.

**Files likely touched:**

- `package.json`
- `app.js`
- `server.js`
- `routes/api.js`
- `tests/integration/health.test.js`
- `tests/helpers/testEnv.js`

**Tasks:**

- [x] Use Node's built-in test runner without adding new test dependencies.
- [x] Replace placeholder `npm test` with a real test command.
- [x] Add `app.js` that builds and exports the Express app without listening.
- [x] Reduce `server.js` to config loading and `server.listen`.
- [x] Add `GET /api/v1/health`.
- [x] Add RED test for `GET /api/v1/health`.
- [x] Implement minimal health route to make the test pass.
- [x] Run focused test: `npm test -- tests/integration/health.test.js`.
- [x] Run full test suite: `npm test`.
- [x] Record rollback boundary: remove test harness/app seam/health route.

## Slice 2 — Configuration fail-fast

**Goal:** Prevent unsafe production defaults and centralize runtime configuration.

**Files likely touched:**

- `config/env.js`
- `config/config.js`
- `config/keys.js`
- `server.js`
- `.env.example`
- `tests/unit/env.test.js`

**Tasks:**

- [x] Add RED tests for missing production `JWT_SECRET`.
- [x] Add RED tests for local/test safe defaults.
- [x] Create `config/env.js` with grouped config exports.
- [x] Enforce required production DB and JWT values.
- [x] Enforce minimum JWT secret length/strength.
- [x] Refactor DB config to consume `config/env.js`.
- [x] Refactor JWT config to consume `config/env.js`.
- [x] Create or update `.env.example` without real secrets.
- [x] Run focused config tests.
- [x] Run full test suite.
- [x] Record rollback boundary: config module + dependent imports.

## Slice 3 — Standard response and error foundation

**Goal:** Introduce a documented API envelope and shared error handling.

**Files likely touched:**

- `utils/apiResponse.js`
- `utils/AppError.js`
- `middleware/errorHandler.js`
- `middleware/notFoundHandler.js`
- `app.js`
- `routes/api.js`
- `tests/integration/error-envelope.test.js`

**Tasks:**

- [x] Add RED test for standardized success envelope on `/api/v1/health`.
- [x] Add RED test for standardized 404/error envelope.
- [x] Implement `success` and `fail` response helpers.
- [x] Implement `AppError`.
- [x] Add centralized error handler.
- [x] Add not-found handler.
- [x] Update health route to use success envelope.
- [x] Run focused response-envelope tests.
- [x] Run full test suite.
- [x] Record rollback boundary: response helpers/error middleware.

## Slice 4 — Auth/JWT hardening

**Goal:** Use one consistent Bearer-token boundary with safe errors.

**Files likely touched:**

- `config/passport.js`
- `middleware/authMiddleware.js`
- `routes/api.js`
- `controllers/usuariosController.js`
- `tests/integration/auth.test.js`
- `tests/helpers/jwt.js`

**Tasks:**

- [x] Add RED test: missing token returns standardized `UNAUTHORIZED`.
- [x] Add RED test: raw token header is rejected.
- [x] Add RED test: invalid token does not leak JWT internals.
- [x] Add RED test: valid user token can call `/api/v1/me`.
- [x] Align `/me` with Passport or a shared verifier.
- [x] Require Bearer tokens only.
- [x] Constrain JWT algorithms.
- [x] Decide service-token behavior in code: harden with tests or isolate for removal.
- [x] Run focused auth tests.
- [x] Run full test suite.
- [x] Record rollback boundary: auth middleware/strategy changes.

## Slice 5 — User/client validation and mass-assignment controls

**Goal:** Reject unsafe writes before they hit database models.

**Files likely touched:**

- `validators/common.js`
- `validators/usuarios.js`
- `validators/clientes.js`
- `controllers/usuariosController.js`
- `controllers/clientesController.js`
- `tests/integration/usuarios-validation.test.js`
- `tests/integration/clientes-validation.test.js`

**Tasks:**

- [x] Add RED test proving forbidden user fields cannot be persisted.
- [x] Add RED test proving forbidden client fields cannot be persisted.
- [x] Add RED test for invalid pagination/search values.
- [x] Add validation helpers and explicit field allowlists.
- [x] Update user create/update to persist allowlisted fields only.
- [x] Update client create/update to persist allowlisted fields only.
- [x] Return standardized validation errors.
- [x] Run focused validation tests.
- [x] Run full test suite.
- [x] Record rollback boundary: validators + user/client controller changes.

## Slice 6 — SQL safety and transaction boundary

**Goal:** Make dynamic SQL safer and protect one high-impact multi-step workflow.

**Files likely touched:**

- `models/apiModel.js`
- `models/clientesModel.js`
- `db/transaction.js` or `utils/transaction.js`
- selected workflow controller, likely `controllers/cotizacionesController.js` or `controllers/ordenesController.js`
- `tests/integration/sql-safety.test.js`
- `tests/integration/transactions.test.js`

**Tasks:**

- [x] Add RED test for search with SQL-special characters.
- [x] Add RED test for rollback on one selected multi-step workflow failure.
- [x] Add internal allowlists for dynamic SQL identifiers.
- [x] Add transaction helper.
- [x] Refactor selected workflow to use transaction helper.
- [x] Run focused SQL/transaction tests.
- [x] Run full test suite.
- [x] Record rollback boundary: model helper constraints + selected workflow transaction.

## Slice 7 — Swagger/OpenAPI alignment

**Goal:** Make docs match the standardized API contract.

**Files likely touched:**

- `swagger.js`
- `generateSwagger.js`
- `swagger.json` or `public/swagger.json` after source-of-truth decision
- route/controller Swagger annotations
- `tests/integration/swagger.test.js`

**Tasks:**

- [x] Decide one generated Swagger JSON artifact or dynamic-only runtime docs.
- [x] Add shared OpenAPI schemas for success/error envelopes.
- [x] Add Bearer JWT security scheme.
- [x] Update documented server URLs to prefer HTTPS production and local dev.
- [x] Add test/check that Swagger UI route responds.
- [x] Add CI-compatible Swagger generation/check if generated JSON remains committed.
- [x] Run focused Swagger test/check.
- [x] Run full test suite.
- [x] Record rollback boundary: Swagger docs/generation only.

## Slice 8 — GitHub Actions CI

**Goal:** Block broken changes before PR merge.

**Files likely touched:**

- `.github/workflows/ci.yml`
- `package.json` if adding `ci` script
- `README.md` if documenting CI locally

**Tasks:**

- [x] Add CI workflow on `pull_request` and `push` to `main`.
- [x] Use least-privilege permissions: `contents: read`.
- [x] Use Node setup with npm cache.
- [x] Run `npm ci`.
- [x] Run `npm test`.
- [x] Include MySQL service container only if E2E fixtures are ready.
- [x] Avoid direct secret interpolation in shell `run:` blocks.
- [x] Add concurrency group for PR builds.
- [x] Run CI workflow locally where practical or validate YAML syntax.
- [x] Record rollback boundary: CI workflow files.

## Slice 9 — Production deploy automation for Digicom LXC 101

**Goal:** Define and automate guarded deployment after CI passes.

**Files likely touched:**

- `.github/workflows/deploy.yml`
- `deploy/production.sh` or `scripts/deploy-production.sh`
- `ecosystem.config.js` if PM2 is selected
- `README.md` or `docs/deployment.md`

**Tasks:**

- [x] Use Digicom LAN deployment context:
  - Proxmox PVE: `<PROXMOX_LAN_HOST>`
  - LXC 101: `<LXC_APP_LAN_IP>`
  - host command path: `ssh -i <ssh-key-path> -p 22 <ssh-user>@<PROXMOX_LAN_HOST> "pct exec 101 -- bash -lc '<command>'"`
- [x] Decide process manager: PM2 is preferred unless current production proves otherwise.
- [x] Add protected production deployment workflow.
- [x] Require CI success before deploy.
- [x] Define GitHub secrets without printing them:
  - `PROD_SSH_HOST`
  - `PROD_SSH_PORT`
  - `PROD_SSH_USER`
  - `PROD_SSH_KEY`
  - `PROD_APP_PATH`
- [x] Check production tree is clean before reset/pull.
- [x] Install production dependencies with `npm ci --omit=dev`.
- [x] Restart PM2/systemd process.
- [x] Smoke-check `/api/v1/health`.
- [x] Document rollback to previous commit.
- [x] Do not modify Caddy, Proxmox, MikroTik, or DB schema from this workflow.
- [x] Run deploy dry-run or script syntax validation before any production execution.

## Slice 10 — Final verification and release readiness

**Goal:** Prove the integrated tracker is safe before `main` merge.

**Tasks:**

- [ ] Run `npm ci` from a clean checkout/worktree.
- [x] Run `npm test`.
- [ ] Run E2E with isolated MySQL fixtures.
- [x] Run Swagger check if enabled.
- [ ] Confirm CI is green on the PR chain.
- [ ] Validate RDD/review receipt gates before delivery.
- [ ] Confirm LXC 101 deploy target tree is clean and not carrying unresolved local production changes.
- [x] Confirm rollback instructions are accurate.
- [ ] Merge to `main` only after all checks pass and PR chain is approved.

## Parallel worktree policy

- [x] Allowed: independent docs/Swagger/CI/deploy-planning slices after foundation artifacts exist.
- [x] Not allowed: parallel edits to `app.js`, `server.js`, auth middleware, response helpers, or shared config before their owning slice lands.
- [x] Every worktree must use a unique branch and exact slice boundary.
- [x] No branch may deploy or merge to `main` without CI/E2E/RDD evidence.

## Implementation order

1. Slice 1 — Test harness and health baseline.
2. Slice 2 — Configuration fail-fast.
3. Slice 3 — Standard response/error foundation.
4. Slice 4 — Auth/JWT hardening.
5. Slice 5 — Validation and mass-assignment controls.
6. Slice 6 — SQL safety and one transaction boundary.
7. Slice 7 — Swagger/OpenAPI alignment.
8. Slice 8 — CI.
9. Slice 9 — Production deployment automation.
10. Slice 10 — Integrated verification and release readiness.
