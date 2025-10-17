# CONTRIBUTING.md

> Thanks for your interest in contributing to *Talent Board*! 🎉
> This guide explains how to set up the project, the conventions we follow, and how to propose, build, and ship changes confidently.

---

## 1) Ground rules

- Be respectful and constructive. We follow a lightweight Code of Conduct based on the Contributor Covenant.
- Write secure, maintainable code with tests.
- Prefer small, focused Pull Requests (PRs) over large ones.
- Document behavior changes (Swagger docs and JSDoc/comments where relevant).
- Avoid breaking public contracts without discussion.

---

## 2) Tech stack

- *Node.js, **Express, **TypeScript*
- *PostgreSQL* + *TypeORM*
- *Redis* + *BullMQ* (queues/workers)
- *Passport.js* (Google/LinkedIn OAuth 2.0)
- *Jest* (tests)
- *Docker Compose* (local infra for Postgres/Redis/Adminer)

> The *README.md* already contains high-level project structure and tech overview. This document focuses on how to contribute.

---

## 3) Prerequisites

- Node.js ≥ 18
- *Yarn* (the project uses Yarn; please do not switch package managers)
- Docker + Docker Compose (for local Postgres/Redis/Adminer and test profiles)
- A PostgreSQL client (optional) if you prefer connecting without Adminer

---

## 4) One-time local setup

bash
git clone https://github.com/<org>/talent-board-be.git
cd talent-board-be
yarn install
cp .env.example .env
# Fill in DB/Redis/OAuth values in .env


*Environment variables (minimum needed)*

- PORT, NODE_ENV
- DATABASE_URL (PostgreSQL)
- REDIS_URL (or discrete REDIS_HOST/REDIS_PORT if your utils support it)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
- BASE_URL, API_PREFIX

> Never commit secrets. Use per-machine override files (e.g., .env.local) and your OS secret store.

---

## 5) Running locally (backend + infra)

*Start Postgres/Redis/Adminer in dev:*

bash
yarn db:dev:up


*Run the backend in dev (hot-reload):*

bash
yarn dev


*(Optional) Run backend via Docker service:*

bash
yarn backend:dev:up
yarn backend:dev:logs
# when needed:
yarn backend:dev:restart


*Shut down/remove dev infra:*

bash
yarn db:dev:rm
# or rebuild from scratch:
yarn db:dev:rebuild


---

## 6) Database & migrations (TypeORM)

*Create a blank migration file:*

bash
yarn migration:create


*Generate a migration from entity changes:*

bash
yarn migration:generate


*Apply migrations:*

bash
yarn migration:run


*Revert last migration:*

bash
yarn migration:revert


*Reset schema (dev only):*

bash
yarn reset-db


> Tip: For Dockerized workflows, there are helpers like yarn docker:reset-db and yarn docker:seed.

---

## 7) Seeding data

*Seed development data:*

bash
yarn seed:dev


*Seed production-safe fixtures (idempotent where possible):*

bash
yarn seed:prod


---

## 8) Queues & workers (BullMQ + Redis)

Workers live under src/workers/ and queues under src/queues/.
When you create a new job type:

1. Define the queue in src/queues/*.
2. Implement the worker processor in src/workers/*.
3. Ensure worker bootstrap (src/workers/index.ts) loads your processor.
4. Add tests for job creation and processor behavior (unit/integration).

> Keep jobs idempotent. Validate inputs defensively. Use backoff/retry strategies appropriately.

---

## 9) Testing

*Local test DB (profile):*

bash
yarn db:test:up
# reset if needed
yarn db:test:reset


*Run tests (Node):*

bash
yarn test
yarn test:watch


*Run tests (Docker profile):*

bash
yarn test:docker
yarn test:docker:watch


*Testing guidance*

- Put tests under src/__tests__/… mirroring feature folders.
- Cover controllers (happy + error), services, middlewares, strategies, and utils.
- Mock network and OAuth providers. Do not call live external services in tests.
- Aim for meaningful coverage on changed code paths.

---

## 10) Git workflow

*Branches*

- main — always releasable
- dev — integration branch for next release
- feature/<short-name> — new features
- fix/<short-name> — bug fixes
- chore/<short-name> — tooling/docs/infra

---

## 11) Commit messages (Commitlint)

Use *Conventional Commits* (enforced by commitlint/husky):


type(scope): short imperative description


*Types*: feat, fix, docs, chore, refactor, test, perf, build, ci

*Examples*


feat(auth): add LinkedIn OAuth callback guards
fix(talents): clamp homepage ranking score when skills missing
chore(docker): add Adminer to dev compose profile


*Husky setup*

bash
yarn prepare


> This installs git hooks so commitlint runs automatically.

---

## 12) Pull Requests

*Target branch:* dev (hotfixes may target main with prior maintainer approval).

*PR checklist (copy into your PR)*

- [ ] Small, focused changes (scoped to one concern)
- [ ] Clear title & description; linked issue if applicable
- [ ] Tests added/updated and passing (yarn test)
- [ ] Migrations reviewed (forward & backward safety considered)
- [ ] Swagger docs updated (src/docs/*) if API changed
- [ ] No secrets or credentials in code or logs
- [ ] Logs are structured and at appropriate levels
- [ ] Error messages are actionable and user-safe

*Review etiquette*

- Be specific, kind, and actionable.
- Prefer questions over directives when unsure.
- Request changes only when they block correctness, security, or maintainability.

---

## 13) Coding conventions

- *TypeScript*: strict types; no any unless unavoidable (justify in code comments).
- *Module flow: **Routes → Validation → Middlewares/Guards → Controller → Service*.
- *Validation*: Centralize request validation with existing middlewares/schemas; do not bypass validation in controllers.
- *Error handling*: Use typed errors in src/exceptions/*; centralize translation via errorHandler.
- *Function style: Prefer **function expressions* for consistency across the codebase.
- *Dates: Accept YYYY-MM-DD convenience, but **normalize to ISO 8601* internally (e.g., 2025-10-01T00:00:00.000Z) and return ISO in responses.
- *Pagination: Support page (default 1) and limit (default 10) as **numbers*; coerce and validate types server-side.
- *Security*: Use helmet, cors, hpp configs in config/*. Never echo secrets. Sanitize user output. Validate file uploads and MIME types.
- *Queues*: Keep processors idempotent; isolate side effects; attach meaningful job names and `jobId`s when deduplication matters.
- *Logs*: Use the shared logger with context (request id, user id where applicable). Avoid logging sensitive data.

---

## 14) API conventions

- *Versioning*: Prefix routes with /api/v1.
- *Error envelope* (consistent shape):

  json
  {
    "status": "error",
    "message": "<message>",
    "status_code": "<status_code"
  }
  

- *Swagger*: Keep src/docs/* in sync with endpoints, params, and error shapes.
- *Idempotency*: Consider idempotency keys for creates where retries are likely.
- *Auth*: Endpoints requiring authentication must check access tokens and roles (see middlewares/checkRole.ts).

---

## 15) OAuth (Google/LinkedIn)

- Configure *web* callback URLs in respective provider consoles.
- Keep provider-specific logic in src/auth/{google|linkedin}/.
- Store only necessary profile fields. Never store provider access tokens in plain text.
- Add unit tests for controller, service, and strategy flows.

---

## 16) Working with Docker profiles

*Dev profile:*

bash
yarn db:dev:up
# Adminer usually at http://localhost:8080 (see docker-compose.yml)


*Test profile:*

bash
yarn db:test:up
yarn test:docker


*Reset helpers:*

bash
yarn db:test:reset
yarn db:dev:rebuild


---

## 17) Reporting issues & proposing changes

*Bugs*

- Steps to reproduce
- Expected vs actual behavior
- Logs (redact sensitive info)
- Environment (branch, commit, OS, Node version)

*Features / refactors*

- Problem statement
- Proposed approach (+ alternatives considered)
- Data model or API impact
- Migration plan (if any)
- Test strategy

> For substantial changes, open a short “mini-ADR” issue first to align on direction before coding.

---

## 19) Maintainers

- [Wasiu Bakare](https://github.com/AdeGneus)
- [Paul Salako](https://github.com/PaulMarv)
- [Fred John](https://github.com/jeanvjean)

---