# Design: Stabilize API Talleres

## Summary

Stabilization will preserve the current Express/CommonJS application shape while introducing safe seams: an importable app factory, centralized configuration validation, standardized response helpers, a single authentication boundary, request validation/field allowlists, a real test/E2E harness, CI, and guarded deployment automation for Digicom LXC 101.

The API response contract will be standardized even if existing clients require updates.

## Architecture decisions

### 1. Keep Express/CommonJS and add seams instead of rewriting

The project stays on Express 4 and CommonJS. The first implementation slice creates a testable boundary by separating app creation from process listening:

- `app.js` builds and exports the Express application.
- `server.js` loads config and starts the HTTP listener.
- Tests import `app` directly and use Supertest.

This reduces risk because routes/controllers/models remain recognizable while tests can run without binding production ports.

### 2. Centralized configuration module

Create a single configuration module responsible for loading and validating environment variables. The module should expose a plain object consumed by server, auth, database, Swagger, and deployment checks.

Proposed module:

- `config/env.js`

Responsibilities:

- Load `.env` only once.
- Define defaults for local/test mode.
- Fail fast in production if required values are missing.
- Enforce `JWT_SECRET` minimum strength.
- Expose `server`, `database`, `jwt`, and `swagger` configuration groups.

Production must not silently fall back to localhost/root/empty-password values.

### 3. Standard response and error helpers

Create shared response helpers and an application error type:

- `utils/apiResponse.js`
- `utils/AppError.js`
- `middleware/errorHandler.js`
- `middleware/notFoundHandler.js`

Standard envelopes:

```json
{
  "success": true,
  "data": {},
  "message": "optional message"
}
```

```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "safe message",
    "details": {}
  }
}
```

Controllers should gradually call `success(res, data, options)` and pass errors to `next(error)` instead of sending raw database or JWT errors.

### 4. Test harness and E2E approach

Use Node's built-in `node:test` runner for the first API/E2E baseline to avoid adding a large dependency lockfile in the foundational slice. HTTP tests should create an ephemeral server from the importable Express app and use Node's native `http` client.

Proposed structure:

```text
tests/
  integration/
    health.test.js
    auth.test.js
  helpers/
    testEnv.js
    db.js
```

Initial E2E scope:

- DB-independent health endpoint.
- Login success/failure when fixture DB is available.
- Missing/invalid token behavior.
- Standard error envelope.

Database-backed E2E should use an isolated MySQL test DB. The existing `database/setup_local.sql` may inform fixtures, but CI must use a non-interactive, test-only setup path.

### 5. Authentication boundary

Unify protected routes on Passport JWT strategies or a shared verifier. Since most routes already use Passport, the preferred design is:

- Keep Passport strategies for `jwt-usuario` and `jwt-cliente`.
- Replace `/api/v1/me` custom raw-token middleware with Passport-backed user auth.
- Require `Authorization: Bearer <token>` only.
- Constrain algorithm to `HS256` unless a future key-rotation design changes it.
- Return standardized `UNAUTHORIZED` responses without exposing verifier internals.

Service-token behavior is a risk. Default design: keep it only if tests prove its trust boundary and required claims; otherwise remove it during auth-hardening slice.

### 6. Request validation and allowlists

Add lightweight validation before writes. To keep change size small, avoid a broad validation-framework migration in the first slice unless tasks prove it is cheap.

Preferred first pass:

- Define per-endpoint allowlists for users and clients.
- Normalize `id`, `page`, `perPage`, and `search` using helpers.
- Reject unknown/forbidden write fields with `VALIDATION_ERROR`.

Possible module layout:

```text
validators/
  common.js
  usuarios.js
  clientes.js
```

If `zod` is added, keep it in the same PR slice as tests that prove validation behavior.

### 7. SQL and transaction design

Keep existing MySQL driver usage, but constrain dynamic SQL and introduce transaction helpers.

Proposed modules:

- `db/transaction.js` or `utils/transaction.js`
- internal allowlists inside `models/apiModel.js` and `models/clientesModel.js`

Rules:

- User input goes through placeholders.
- Table/column identifiers come from internal allowlists only.
- Multi-step writes use `beginTransaction`, `commit`, and `rollback`.

First transaction target should be selected by risk and testability. Recommended first candidate: quotation approval or order creation because partial failure can leave visible business state inconsistent.

### 8. Swagger/OpenAPI strategy

Use route annotations as the source of truth and keep generated JSON deterministic.

Design options:

- Serve Swagger UI dynamically from `swagger.js` during runtime.
- Keep one generated JSON artifact only if CI verifies it is current.
- Add shared schemas for success/error envelopes and Bearer auth.
- Prefer HTTPS production server URL in docs.

Avoid maintaining both root `swagger.json` and `public/swagger.json` unless there is a clear runtime need.

### 9. CI design

Add GitHub Actions CI after the first real test command exists.

Workflow shape:

- Trigger: `pull_request`, `push` to `main`.
- Permissions: `contents: read`.
- Node setup with npm cache.
- `npm ci`.
- `npm test`.
- Optional: `npm run lint` once lint exists.
- Optional: Swagger drift check after OpenAPI generation is deterministic.

No secrets are needed for baseline CI. E2E with MySQL should use a GitHub service container and test-only credentials.

### 10. Production deployment design for Digicom LAN

Current operating context is Digicom LAN.

LAN access path:

```bash
ssh -i <ssh-key-path> -p 22 <ssh-user>@<PROXMOX_LAN_HOST>
pct exec 101 -- bash -lc '<command>'
```

Target:

- Proxmox PVE: `<PROXMOX_LAN_HOST>`
- LXC 101: `linode-migrado`, `<LXC_APP_LAN_IP>`
- Expected app path: `/var/www/html/talleres_api`

Deployment automation should be protected and explicit:

- CI validates first.
- Deploy workflow runs only through a protected production environment.
- Deployment checks that production working tree is clean before reset/pull.
- Deployment installs production dependencies with `npm ci --omit=dev`.
- Process manager is PM2 or systemd, selected in tasks before implementation.
- Post-deploy smoke checks call `/api/v1/health`.
- Rollback records previous commit and restart command.

CI must not modify Caddy, Proxmox configuration, MikroTik rules, or databases without a separate approved infrastructure procedure.

### 11. Worktree and chained PR strategy

Because API response standardization is accepted as potentially breaking, the safest chained-PR topology is `feature-branch-chain`:

- Create a tracker branch for the full stabilization.
- Build each slice in its own branch/worktree.
- Child PRs target the tracker/previous slice branch as appropriate.
- Only the final integrated tracker branch should merge into `main` after CI/E2E and review gates pass.

Parallel worktrees are allowed only for independent slices. Foundational slices must remain sequential:

1. test harness + app seam;
2. config fail-fast;
3. response/auth foundation.

Later slices such as Swagger docs and deploy workflow may run in parallel once their dependencies are explicit.

## Slice dependencies

```text
health/test harness
  -> config fail-fast
  -> response envelope
  -> auth hardening
  -> validation/allowlists
  -> transaction workflow
  -> swagger alignment
  -> CI
  -> deploy guardrails
```

Some slices can overlap after the first foundation:

```text
                 -> swagger alignment
response envelope -> auth hardening -> validation
                 -> CI updates
health endpoint  -> deploy smoke checks
```

## Verification strategy

Every implementation slice must include:

- focused Jest/Supertest tests;
- E2E proof when behavior crosses HTTP + database/auth boundaries;
- `npm test` evidence;
- CI evidence before merge;
- rollback boundary in PR notes.

Production readiness also requires:

- clean LXC 101 working tree;
- expected commit deployed;
- process manager status;
- `/api/v1/health` smoke check from the LAN or edge path.

## Risks

- Standardized API envelopes may require client updates.
- E2E depends on deterministic MySQL fixtures that do not exist yet.
- Deployment automation depends on process-manager choice and the current state of LXC 101.
- Parallel worktrees can create integration conflicts if foundational modules are edited independently.

## Open implementation choices for tasks

- Choose PM2 vs systemd for production. Existing observations suggest PM2 is present on LXC 101, so PM2 is the likely default.
- Decide whether to keep Node's built-in test runner for all slices or introduce a test dependency in a later isolated lockfile slice.
- Decide whether to add Zod or use lightweight local validators first.
- Decide whether service tokens are used in production; if unknown, tasks should isolate that as a small decision/follow-up before removal.
