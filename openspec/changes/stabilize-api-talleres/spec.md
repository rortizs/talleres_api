# Spec: Stabilize API Talleres

## Overview

This specification defines the stabilization requirements for `api_talleres`, a Node.js/Express REST API deployed to the Digicom infrastructure. The change intentionally prioritizes a safer, standardized production API over preserving inconsistent legacy response shapes.

## Requirements

### R1 — Runtime health and startup

- The API MUST expose a deterministic health endpoint under `/api/v1/health`.
- The health endpoint MUST return HTTP `200` when the process is alive and configuration has loaded.
- The health response MUST use the standardized success envelope.
- The Express app MUST be importable by tests without opening a network listener.
- The server entrypoint MUST be responsible for listening on `HOST` and `PORT`.
- The default local host MAY be `0.0.0.0`, but hard-coded workstation IPs MUST NOT be used.

#### Acceptance criteria

- `npm test` includes an HTTP test proving `GET /api/v1/health` returns `200`.
- Importing the app in tests does not bind a port.
- Starting the app uses environment-driven `HOST` and `PORT`.

### R2 — Automated tests and E2E baseline

- The repository MUST replace the placeholder test script with a real automated test command.
- The test stack MUST support HTTP endpoint testing without requiring production services.
- E2E tests MUST run against an isolated test database or deterministic test fixture setup.
- Destructive fixture setup MUST be impossible against production by default.
- Tests MUST cover at least:
  - health endpoint;
  - user login success and failure;
  - missing/invalid token behavior;
  - one representative protected endpoint;
  - standardized error envelope;
  - one request-validation failure.

#### Acceptance criteria

- `npm test` exits `0` only when the automated suite passes.
- E2E setup documents the test database name and safety guard.
- CI can run the test suite from a clean checkout.

### R3 — Configuration fail-fast

- Configuration MUST be centralized in one module.
- Production-sensitive values MUST come from environment variables.
- In production mode, startup MUST fail if required values are missing or unsafe.
- Required production values include:
  - `JWT_SECRET`;
  - `DB_HOST`;
  - `DB_USER`;
  - `DB_PASSWORD`;
  - `DB_NAME`;
  - `PORT`.
- `JWT_SECRET` MUST satisfy a minimum strength rule suitable for HMAC signing.
- Local/test mode MAY provide explicit safe defaults, but those defaults MUST NOT silently apply in production.
- `.env.example` MUST document required variables without real secrets.

#### Acceptance criteria

- Tests prove production config fails when `JWT_SECRET` is missing.
- Tests prove local/test config can load without production credentials when safe defaults are explicitly allowed.
- No real secrets are committed in config or docs.

### R4 — Standard API envelope

- Success responses SHOULD use:

```json
{
  "success": true,
  "data": {},
  "message": "optional human-readable message"
}
```

- Error responses MUST use:

```json
{
  "success": false,
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "safe human-readable message",
    "details": {}
  }
}
```

- Raw internal errors, database errors, stack traces, and JWT verifier internals MUST NOT be sent to clients.
- The standard envelope MAY break old response shapes; this is accepted by the product decision.

#### Acceptance criteria

- Tests verify one success response and one error response use the standard envelopes.
- Unknown errors return a safe `INTERNAL_SERVER_ERROR`-style response.
- Validation errors include actionable details without leaking internals.

### R5 — Auth and JWT hardening

- Authentication MUST use one consistent verification boundary.
- Bearer tokens MUST be required for protected routes.
- Raw token headers MUST NOT be accepted.
- JWT verification MUST constrain accepted algorithms.
- JWT errors MUST be mapped to safe standardized API errors.
- `/api/v1/me` MUST use the same auth boundary as other protected user routes.
- Service-token behavior MUST be explicitly designed and tested, or removed.

#### Acceptance criteria

- Tests cover missing token, malformed Authorization header, invalid token, and valid token.
- Tests prove raw tokens are rejected.
- Tests prove the configured algorithm allowlist is used.
- `/api/v1/me` returns the authenticated principal through the standard success envelope.

### R6 — Request validation and mass-assignment control

- User/client create and update endpoints MUST only persist allowlisted fields.
- Request validation MUST reject invalid input before database writes.
- Pagination and search params MUST be normalized and bounded.
- Unknown or forbidden fields MUST either be rejected with a validation error or ignored by explicit design; the chosen behavior MUST be consistent and tested.

#### Acceptance criteria

- Tests prove forbidden fields cannot be persisted through user/client create/update.
- Tests prove invalid payloads return standardized validation errors.
- Tests prove pagination bounds are enforced.

### R7 — SQL safety and transaction boundaries

- User input MUST NOT be concatenated into SQL strings.
- Dynamic table/column usage MUST be constrained to internal allowlists.
- Multi-step writes that can leave inconsistent domain state MUST use transactions.
- At least one high-impact workflow MUST be transaction-protected in this stabilization.

#### Acceptance criteria

- Tests cover one search query with SQL-special characters without query failure or injection behavior.
- Tests cover rollback behavior for one transaction-protected workflow.
- Code review can identify explicit allowlists for dynamic SQL helpers.

### R8 — Swagger/OpenAPI alignment

- Swagger/OpenAPI documentation MUST document the standard success/error envelope.
- Authenticated routes MUST declare Bearer JWT security.
- Base URLs MUST not hard-code insecure production HTTP as the only documented server.
- If generated Swagger JSON remains committed, CI MUST check it is current or generation MUST be deterministic and documented.

#### Acceptance criteria

- Swagger UI loads locally.
- OpenAPI includes the auth scheme and shared error schema.
- Generated documentation does not drift silently from route definitions.

### R9 — GitHub Actions CI

- The repository MUST include a CI workflow for pull requests and pushes to `main`.
- CI MUST use least-privilege permissions.
- CI MUST install dependencies with `npm ci`.
- CI MUST run the real automated test command.
- CI SHOULD include E2E once deterministic fixtures are available.
- Secrets MUST NOT be interpolated directly into shell `run:` blocks.

#### Acceptance criteria

- A clean GitHub Actions runner can execute CI without local-only files.
- CI fails when tests fail.
- Branch protection can require the CI workflow before merge.

### R10 — Production deployment guardrails

- Deployment automation MUST be separate from CI validation.
- Production deploy MUST require a protected GitHub environment or explicit human approval.
- Deployment MUST target Digicom LXC 101 only after its working tree is clean and aligned with the approved commit.
- Deployment MUST define whether it connects directly to LXC 101 or via Proxmox `pct exec 101`.
- Deployment MUST install production dependencies reproducibly.
- Deployment MUST restart the configured process manager and run post-deploy smoke checks.
- Deployment MUST include rollback instructions.
- Deployment MUST NOT mutate Caddy, Proxmox, MikroTik, or database schema without a separately approved plan.

#### Acceptance criteria

- Deploy workflow or deploy plan defines required GitHub secrets.
- Post-deploy smoke check includes `/api/v1/health`.
- Rollback path names the previous commit and restart procedure.

### R11 — Review workload and worktree discipline

- Implementation MUST be split into chained PR slices when a slice risks exceeding 400 changed lines.
- Tests and documentation MUST stay with the behavior they verify.
- Parallel worktrees MAY be used only for independent slices with isolated branches.
- A slice MUST not depend on unmerged code from a different parallel worktree unless the chain relationship is explicit.
- Merge to `main` MUST happen only after CI/E2E evidence is green and RDD/review gates permit delivery.

#### Acceptance criteria

- Tasks define reviewable work units with rollback boundaries.
- No implementation slice exceeds the 400-line budget without explicit `size:exception` approval.
- No direct `main` merge occurs without passing verification evidence.

## Non-functional constraints

- Keep CommonJS/Express architecture unless a later approved change says otherwise.
- Generated technical artifacts remain in English.
- Production secrets remain outside the repository.
- Avoid broad rewrites; stabilize the current system through reviewable slices.

## Traceability

- Proposal: `openspec/changes/stabilize-api-talleres/proposal.md`
- Exploration: `openspec/changes/stabilize-api-talleres/explore.md`
- Project context: `openspec/project.md`
