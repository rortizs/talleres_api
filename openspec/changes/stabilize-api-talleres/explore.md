# Explore: stabilize-api-talleres

## Summary

The repository is a small Express 4 / CommonJS REST API for a workshop-management backend. It exposes versioned endpoints under `/api/v1`, serves Swagger UI under `/api-docs`, uses MySQL through a `mysql2` connection pool, and authenticates most resource routes with Passport JWT strategies for users and clients.

The stabilization change should be implemented as chained PR slices. The highest-risk areas are configuration/secrets fail-fast behavior, JWT/auth hardening, request validation and mass-assignment control, error-response consistency, automated test/E2E capability, CI, and production deployment automation for Digicom LXC 101.

## Evidence reviewed

### Project and package state

- `openspec/config.yaml` records hybrid artifact mode, `stabilize-api-talleres` as the default change, `auto-chain` delivery strategy, a 400-line review budget, receipt-driven development enabled, and E2E required for apply/verify.
- `package.json` declares `server.js` as the main entrypoint and has only two scripts: `npm start` runs `node server.js`; `npm test` is the placeholder `echo "Error: no test specified" && exit 1`.
- Dependencies include Express, CORS, Morgan, dotenv, MySQL clients (`mysql`, `mysql2`), Passport JWT, jsonwebtoken, bcryptjs, and Swagger tooling. No dedicated test runner or E2E tool is declared.
- No `.github/**` workflow files were found. No `deploy*` files were found in the repository.

### Server startup and middleware

- `server.js` calls `require("dotenv").config()`, creates an Express app and HTTP server, then listens on `process.env.PORT || 3000` and `process.env.HOST || "0.0.0.0"`.
- Global middleware includes Morgan `dev`, `express.json()`, `express.urlencoded({ extended: true })`, unrestricted `cors()`, Passport initialization, `app.disable("x-powered-by")`, and static serving from `public`.
- Routes are mounted as `app.use("/api/v1", apiRouter)` and Swagger UI as `app.use("/api-docs", swaggerRouter)`.
- The root route returns a plain text readiness-style message, but there is no explicit health/readiness endpoint for CI/CD or production deployment gates.
- The error handler returns `{ message, status }` and logs the raw server error to stderr. Controller-level handlers often return a different shape, usually `{ message, error }` or domain-specific JSON.

### Routing and API surface

- `routes/api.js` is the central router. It imports user, client, order, license, dashboard, quotation, price-configuration, and notification controllers.
- Public auth endpoints are `POST /api/v1/login` for users and `POST /api/v1/clientes/login` for clients.
- User endpoints (`/usuarios`, `/usuarios/:id`) are guarded with `passport.authenticate("jwt-usuario", { session: false })`.
- Client CRUD and client-related history endpoints are guarded with `passport.authenticate("jwt-cliente", { session: false })`.
- Workshop operational endpoints for orders, licenses, dashboard, quotations, price configuration, and notifications are guarded with `jwt-usuario`.
- `GET /api/v1/me` uses the custom `middleware/authMiddleware.js` directly instead of Passport.

### Controllers and model/query style

- `controllers/usuariosController.js` and `controllers/clientesController.js` use `bcryptjs` for password hashing/comparison and issue JWTs with `jsonwebtoken` using settings from `config/keys.js`.
- The generic `models/apiModel.js` and `models/clientesModel.js` use parameter placeholders for IDs/search values and escaped identifiers (`??`) for internal table/field names. However, generic dynamic `columns`/`fields` strings and controller-spread request bodies still need allowlisting before they are treated as safe boundaries.
- Several controllers (`ordenesController.js`, `licenciasController.js`, `dashboardController.js`, `cotizacionesController.js`, `preciosController.js`, `notificacionesController.js`) use direct `db.query` calls. The reviewed SQL mostly uses placeholders for request-derived values, including filters, IDs, and insert/update objects.
- Input validation is currently ad hoc. Examples: order creation checks only `cliente` and `equipo`; price calculation checks required fields; licenses validate category membership; many fields pass through without schema validation, normalization, range checks, or explicit allowlists.
- User/client creation and updates spread `...otherData` into database writes. This is a mass-assignment risk because request bodies can set fields outside the intended API contract unless controller-level allowlists are added.
- Some multi-step writes are not transaction-wrapped. Examples include order/customer creation plus history writes, quotation creation plus item inserts, quotation approval plus order update, and client cascade deletion. Partial failure can leave inconsistent state.

### Authentication and authorization

- `config/keys.js` exports `secretOrKey: process.env.JWT_SECRET` and `expiresIn: process.env.JWT_EXPIRES_IN || "1h"`; there is no fail-fast check that the JWT secret exists or is strong enough before the server starts.
- `config/passport.js` configures two Passport JWT strategies (`jwt-cliente` and `jwt-usuario`) with `ExtractJwt.fromAuthHeaderAsBearerToken()` and the shared secret.
- `jwt-usuario` accepts a `jwt_payload.type === 'service_token'` branch that bypasses user lookup and fabricates a service account principal. This needs a concrete trust boundary, issuer/audience/algorithm constraints, and tests before production deployment.
- `middleware/authMiddleware.js` accepts both `Bearer <token>` and raw token formats, calls `jwt.verify(token, keys.secretOrKey)` without an explicit algorithm allowlist, and returns `err.message` in the response body. That should be hardened and aligned with Passport behavior.
- Route guards authenticate the caller type but do not consistently enforce role-based or object-level authorization in controllers. For example, operational `jwt-usuario` routes do not visibly check admin/technician/recepcionist permissions at the route boundary.

### Configuration and secret handling

- `config/config.js` creates a MySQL pool from `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`, defaulting to localhost/root/empty-password/mapos. Those defaults are convenient locally but unsafe for production if environment variables are missing.
- The pool validates a connection at startup and logs connection-specific error classes, but startup continues even if the initial database connection fails.
- `server.js`, `config/config.js`, and `config/keys.js` each load dotenv/config values independently. Centralizing configuration would make validation and test injection easier.
- Reading `.env.example` was blocked by the safety policy, so this exploration did not inspect environment-template contents.

### Swagger/OpenAPI state

- `swagger.js` serves runtime Swagger UI with a local server URL (`http://localhost:3000/api/v1`).
- `generateSwagger.js`, root `swagger.json`, and `public/swagger.json` use `http://api.taller.digicom.com.gt/api/v1`.
- Swagger sources are configured as `./routes/api.js` and `./controllers/clientesController.js`. Newer controllers are mostly documented through route comments, while controller-level annotations are only included for clients.
- The generated Swagger JSON appears duplicated at the repository root and under `public/`. Future work should decide which artifact is authoritative and whether generation belongs in CI.
- Documentation still references HTTP, not HTTPS. Production deployment should expose HTTPS at the edge and document the deployed base URL accordingly.

### Local database and E2E setup

- `database/setup_local.sql` drops and recreates `mapos_local`, creates the core tables, indexes several common columns, and seeds test users/clients/orders/sales/charges. It is suitable as a starting point for deterministic E2E fixtures, but destructive reset semantics must be explicit and isolated to test databases.
- `database/setup.sh` prompts for a local MySQL root password, may start MySQL via Homebrew, executes `setup_local.sql`, and copies `.env.local` to `.env`. It should not be run in CI or production as-is because it is interactive and mutates local environment files.

### CI/CD and production deployment state

- There are no GitHub Actions workflows under `.github/**`.
- The README includes an Nginx reverse-proxy example for `api.taller.digicom.com.gt`, including a `/deploy` location pointing at `deploy.php`, but no `deploy.php` or deployment script exists in the repository.
- The requested production target is Digicom LXC 101. Based on the loaded Digicom infrastructure skill, LXC 101 is `linode-migrado` on `<LXC_APP_LAN_IP>`; public HTTP/HTTPS generally flows through Caddy LXC 161. This exploration did not contact infrastructure and did not modify Caddy, Proxmox, or MikroTik state.

## Key stabilization risks

1. **No automated test baseline**: `npm test` always fails by design, so CI cannot provide meaningful protection until a real test runner and E2E harness exist.
2. **Configuration does not fail closed**: missing JWT or database environment can fall back to weak/default behavior instead of stopping startup.
3. **JWT verification is underconstrained**: auth paths lack explicit algorithm/issuer/audience validation; the custom middleware accepts raw tokens and leaks verification error messages.
4. **Mass assignment is possible**: user/client controllers spread request bodies into database writes, and generic model helpers accept dynamic field strings.
5. **No consistent API error contract**: controllers and the global handler return different shapes and may expose raw database/auth error messages.
6. **Transactions are missing around multi-step writes**: partial failures can corrupt order, quotation, notification, and client-deletion workflows.
7. **Swagger drift**: runtime docs, generated docs, and production URL references are not clearly synchronized.
8. **Deployment path is aspirational**: README mentions Nginx/deploy.php, but repository automation for GitHub Actions and LXC 101 deployment does not exist.

## Chained PR implementation slices

These slices keep each unit focused and suitable for the 400 changed-line review budget. Tests belong in the same slice as the behavior they verify.

1. **Test harness and health baseline**
   - Add a real Node test runner and HTTP test helper.
   - Separate app construction from server listen if needed for tests.
   - Add `/health` or `/ready` with DB-independent readiness semantics.
   - Replace placeholder `npm test` with the focused automated test command.

2. **Configuration fail-fast**
   - Centralize config loading/validation.
   - Require strong `JWT_SECRET` and explicit DB settings outside local/test mode.
   - Make database connection failure policy explicit and testable.
   - Document safe environment variables without committing secrets.

3. **Auth/JWT hardening**
   - Align `/me` with Passport or a single shared JWT verifier.
   - Require Bearer tokens only, constrain algorithms, and optionally issuer/audience.
   - Define or remove service-token behavior behind a verified trust boundary.
   - Add login, invalid-token, expired-token, and role/principal tests.

4. **Request validation and mass-assignment controls**
   - Introduce schema/allowlist validation for user/client create/update first.
   - Extend to orders, quotations, licenses, prices, and notifications in small follow-up slices if needed.
   - Ensure update endpoints ignore or reject unauthorized fields.

5. **SQL consistency and transaction boundaries**
   - Add transaction helpers for multi-step writes.
   - Start with one high-impact workflow such as quotation approval or order creation.
   - Add regression tests proving rollback on failure.

6. **Consistent error responses**
   - Add a shared error envelope and controller wrapper/helper.
   - Normalize 400/401/403/404/500 responses without leaking raw internals.
   - Preserve existing Spanish/domain messages only where they are part of the API contract.

7. **Swagger/OpenAPI alignment**
   - Decide the authoritative generated artifact location.
   - Ensure Swagger generation covers all controllers/routes.
   - Update base server URLs and add auth/security scheme definitions.
   - Add a CI check that generated Swagger is current, if generated output remains committed.

8. **GitHub Actions CI**
   - Add least-privilege CI workflow using `npm ci` and the real test command.
   - Include E2E setup only after deterministic DB fixtures are available.
   - Use concurrency for PR builds and avoid direct secret interpolation in shell scripts.

9. **Production deploy automation for Digicom LXC 101**
   - Add a deployment plan/workflow with environment protection, explicit secrets, and post-deploy smoke checks.
   - Target app process management on LXC 101 and reverse-proxy exposure through the existing Digicom edge path.
   - Do not mutate Proxmox/Caddy/MikroTik from CI without a documented approval and rollback path.

## Open questions for proposal/design

- Which chain strategy should be used: stacked-to-main or feature-branch-chain? The preflight says chained PRs are intended but the exact strategy is deferred.
- Should the API preserve current response shapes for existing clients, or may stabilization introduce a new standardized error envelope as a breaking change?
- What production domain and process manager are desired for LXC 101 (existing Nginx/Node process, PM2, systemd, or another managed service)?
- Which database should E2E use in CI: a MySQL service container with `setup_local.sql`, a reduced migration/fixture set, or a dedicated test dump maintained separately?

## Recommended next phase

Proceed to `sdd-propose` for `stabilize-api-talleres`, using this exploration as the source for scope, risks, and chained PR boundaries.
