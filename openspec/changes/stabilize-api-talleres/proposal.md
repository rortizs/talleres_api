# Proposal: Stabilize API Talleres

## Problem

`api_talleres` is a small Express 4 / CommonJS REST API with useful workshop-management capabilities, but the current production readiness posture is weak. The repository has no runnable automated test baseline, no GitHub Actions workflow, inconsistent response and error shapes, ad hoc request validation, possible mass-assignment paths, underconstrained JWT verification, unsafe production defaults, missing health/readiness endpoints, and no concrete deployment automation for the Digicom LXC 101 target.

The stabilization work should make the API safer to operate and easier to review without preserving inconsistent legacy response shapes as a hard compatibility constraint. Existing clients may need adjustment if they depend on unstable or inconsistent response/error formats.

## Goals

- Establish a real automated test and E2E baseline that can protect future changes.
- Add a health/readiness surface suitable for CI/CD and production smoke checks.
- Make configuration fail closed for production-sensitive values, especially JWT and database settings.
- Harden authentication and JWT verification around explicit Bearer-token behavior and constrained verification rules.
- Introduce request validation and allowlists to reduce mass-assignment risk.
- Standardize API success/error envelopes and HTTP status handling, even when that requires client updates.
- Improve transactional consistency for high-impact multi-step database workflows.
- Align Swagger/OpenAPI documentation with the implemented API contract.
- Add secure GitHub Actions CI/CD foundations using least privilege and safe secret handling.
- Define production deployment guardrails for Digicom LXC 101 without mutating infrastructure implicitly.

## Non-Goals

- Do not rewrite the application into a different framework or module system.
- Do not replace MySQL or redesign the full database schema except where narrowly required for stabilization.
- Do not preserve every existing response shape for backwards compatibility.
- Do not contact, modify, restart, or reconfigure Proxmox, Caddy, MikroTik, or LXC services during planning phases.
- Do not commit secrets, local `.env` values, production credentials, database dumps, or private infrastructure details beyond already approved operational identifiers.
- Do not implement application code in this proposal phase.

## Scope Boundaries

### In Scope

- Node/Express API stabilization under the existing REST `/api/v1` surface.
- Test runner and E2E harness setup, including deterministic database fixture strategy for CI-safe validation.
- Configuration validation and production-safe startup behavior.
- JWT/auth middleware consolidation and hardening.
- Request schema validation, field allowlists, and standardized API response/error envelopes.
- Transaction helpers and targeted transaction adoption for the riskiest multi-step writes.
- Swagger/OpenAPI generation/documentation alignment.
- GitHub Actions CI with `npm ci`, automated tests, E2E validation, concurrency, and least-privilege permissions.
- Deployment planning/automation for the Digicom LXC 101 application target, including protected environments and smoke checks.

### Out of Scope

- Broad domain-feature changes unrelated to stabilization.
- Direct production infrastructure mutation without a separate approved operational procedure.
- Caddy LXC 161 edits except a separately approved append-only domain/proxy change following the Digicom procedure.
- MikroTik NAT/firewall changes unless a later deployment design proves they are necessary and gets explicit approval.
- Running destructive local database setup scripts outside an isolated test database context.

## Acceptance Criteria

- A meaningful automated test command replaces the placeholder `npm test` and is documented.
- E2E tests exercise at least health/readiness, authentication success/failure, representative protected endpoints, and standardized error responses.
- CI runs from GitHub Actions with least-privilege permissions, dependency installation via `npm ci`, focused automated tests, and the required E2E workflow once fixtures are available.
- Production-sensitive configuration fails closed when required values are missing or unsafe in production mode.
- JWT verification requires Bearer tokens, constrains accepted algorithms, avoids leaking verifier internals, and uses one consistent principal/auth boundary.
- Request validation and field allowlists prevent unauthorized writes for user/client create/update flows before broader endpoint expansion.
- API success and error responses use a documented standard envelope; legacy inconsistent shapes are not treated as blockers.
- At least one high-risk multi-step workflow is transaction-protected with regression coverage for rollback behavior.
- Swagger/OpenAPI output documents the standardized response/error model, auth scheme, and deployed HTTPS base URL strategy.
- Deployment work for Digicom LXC 101 includes protected environment gates, explicit rollback/smoke-check requirements, no raw secret logging, and no unapproved Caddy/Proxmox/MikroTik mutation.
- Each implementation slice stays reviewable under the 400 changed-line budget unless a maintainer explicitly accepts a `size:exception`.

## PR-Chain Strategy Intent

Delivery strategy is `auto-chain`. The change should be implemented as chained, reviewable PR slices rather than one large stabilization PR. The exact chain strategy remains deferred until task planning/apply requires it:

- Use `stacked-to-main` if each slice can land independently on `main` with safe intermediate behavior.
- Use `feature-branch-chain` if the stabilization needs an integration branch so multiple breaking API-contract slices can be coordinated before final release.

Expected slice order:

1. Test harness, app/server separation if needed, and health/readiness baseline.
2. Configuration fail-fast behavior.
3. Auth/JWT hardening.
4. Request validation and mass-assignment controls.
5. Transaction boundaries for high-risk multi-step writes.
6. Standardized response/error envelope rollout.
7. Swagger/OpenAPI alignment.
8. GitHub Actions CI.
9. Digicom LXC 101 deployment automation and guardrails.

Tests and documentation belong in the same work unit as the behavior they verify. Each PR should state dependencies, rollback boundary, verification evidence, and follow-up work.

## E2E and CI/CD Requirements

- E2E validation is mandatory for apply/verify phases.
- Add or select a real test runner before claiming automated test coverage.
- Prefer deterministic MySQL test setup through a CI service container or isolated test database fixtures; never run destructive setup against production or a developer's active database.
- CI should use least-privilege `GITHUB_TOKEN` permissions and avoid direct secret interpolation inside shell `run:` commands.
- CI should use concurrency controls for PR builds and deployment jobs.
- Deployment workflows must use protected GitHub environments and explicit human approval for production.
- Production deployment must include post-deploy smoke checks, at minimum health/readiness and one authenticated or representative API check when safe credentials/fixtures are available.
- Swagger generation/checking should be automated if generated OpenAPI artifacts remain committed.

## Production Deploy Guardrails for Digicom LXC 101

- Target application host: Digicom LXC 101 (`linode-migrado`, LAN `<LXC_APP_LAN_IP>`) as identified by the approved infrastructure context.
- Public HTTP/HTTPS exposure is expected to flow through the existing Digicom edge path and Caddy LXC 161; do not assume direct public routing to LXC 101.
- Do not modify Caddy LXC 161, Proxmox, or MikroTik from CI without an explicit approval, documented command plan, validation, and rollback path.
- Any future Caddy change must follow the append-only Caddyfile procedure, validate syntax, reload without downtime, and verify service status.
- Before any real infrastructure access, confirm whether the operator is on the Digicom LAN or an external network; access method depends on that context.
- Deployment must not print or transform secrets in logs. Use environment-scoped secrets and safe environment variable handling.
- Production rollout must define process management, artifact location, environment variable source, backup/rollback procedure, and smoke-check timeout before first deploy.
- Database migrations or fixture resets must be prohibited in production deployment unless a separate migration plan is explicitly approved.

## Risks and Follow-Up Decisions

- Chain strategy is intentionally deferred and must be chosen before implementation reaches chained PR creation.
- The current API may have undocumented client dependencies on inconsistent responses; standardization is accepted as a breaking stabilization risk.
- CI cannot be meaningful until the placeholder test script is replaced and deterministic E2E fixtures exist.
- Production deployment details for process management on LXC 101 still require design confirmation before automation.
- Auth service-token behavior needs a trust-boundary decision: harden behind explicit constraints or remove if unused.

## Recommended Next Phase

Proceed to `sdd-spec` for `stabilize-api-talleres`, deriving formal requirements from this proposal and the existing exploration artifact.
