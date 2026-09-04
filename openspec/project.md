# Project Context: api_talleres

## Stack

- Runtime: Node.js
- Language/module style: JavaScript, CommonJS
- Web framework: Express 4
- API style: REST endpoints mounted under `/api/v1`
- API documentation: Swagger/OpenAPI through `swagger-jsdoc` and `swagger-ui-express`
- Persistence: MySQL dependencies are present (`mysql`, `mysql2`)
- Authentication: Passport JWT dependencies are present (`passport`, `passport-jwt`, `jsonwebtoken`, `bcryptjs`)

## Package Manager and Commands

- Package manager: npm
- Lockfile: `package-lock.json`
- Install command: `npm ci`
- Start command: `npm start` (runs `node server.js`)
- Test command: `npm test`

## Test Capability

No runnable automated test capability was detected during SDD init.

Evidence:

- `package.json` contains the default placeholder test script: `echo "Error: no test specified" && exit 1`.
- No `*.test.js`, `*.spec.js`, `test/**`, `tests/**`, or `jest.config.*` files were detected.

Future apply/verify work should add or identify meaningful automated tests before relying on test evidence. The session preflight still requires E2E validation when implementation reaches apply/verify.

## Likely Entrypoints

- Application server: `server.js`
- Main API router: `routes/api.js`
- Swagger UI router: `swagger.js`
- Swagger JSON generator: `generateSwagger.js`
- Static assets: `public/`

## CI/CD Suitability

No GitHub Actions workflows were detected under `.github/**`.

The project is suitable for a future npm-based GitHub Actions workflow after a real automated test command is added. A baseline CI should use `npm ci`, then run the real test command once it exists. Until then, the current `npm test` script is intentionally failing placeholder behavior and should not be treated as passing CI evidence.

## SDD Session Defaults

- Planned change: `stabilize-api-talleres`
- Artifact mode: hybrid (`openspec` files plus Engram memory)
- Execution mode: auto
- Delivery strategy: auto-chain
- Review budget: 400 changed lines
- Receipt-driven development: enabled by user request, reported on by global mode
- Verification requirement: E2E required for apply/verify phases
- PR strategy intent: chained PRs; exact chain strategy deferred until tasks/apply needs it

## Safety Notes

- Do not edit application code during this init step.
- Do not read or persist local environment secrets. Runtime configuration is loaded with `dotenv`, and environment files must remain out of SDD artifacts.
- Keep future implementation writes in isolated work units and preserve reviewer workload limits.
