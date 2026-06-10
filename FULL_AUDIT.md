# ShelfToTales — Full Codebase Audit

This audit captures the repository shape, build/test/lint commands, high-level architecture, repository-specific conventions, security/operational hotspots, CI and infra notes, AI-related behavior, and prioritized recommendations. It is intentionally compact but comprehensive and written to be used as a lightweight "memory" document for other agents or future sessions.

Paths referenced are relative to the repository root.

---

## 1) Summary (one-liner)

Monorepo with two independent projects: a Spring Boot backend (Java 17, Maven) and a Next.js frontend (JavaScript). Runtime uses Postgres + Redis via docker-compose; Flyway is the canonical schema source. AI features are optional and fall back to non-ONNX behavior when model files are absent.

Key facts to store for memory (short):
- repo: ShelfToTales (monorepo)
- backend: backend/shelfToTales (Spring Boot 3.4, Java 17, ./mvnw)
- frontend: frontend-next (Next.js 15.5, React 19, JS not TS)
- infra: docker-compose.yml (Postgres 16, Redis 7)
- DB migrations: Flyway under backend/shelfToTales/src/main/resources/db/migration
- AI: ONNX models are not committed; fallback = hash-based similarity; chat default = openrouter

---

## 2) Build, test, and lint (exact commands & how to run a single test)

Backend (backend/shelfToTales/)
- Start infra (from repo root):
  docker compose up -d
- Compile (skip tests):
  ./mvnw -B -ntp -DskipTests compile
- Run app (dev):
  ./mvnw spring-boot:run
- Run all tests:
  ./mvnw -B -ntp test
- Run a single test class:
  ./mvnw test -Dtest=FollowServiceTest
- Run a single test method:
  ./mvnw test -Dtest=OrderServiceTest#placeOrder_succeeds
- Build jar (skip tests):
  ./mvnw clean package -DskipTests
  java -jar target/shelfToTales-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod

Frontend (frontend-next/)
- Install deps:
  npm install  # .npmrc pins legacy-peer-deps
- Dev server:
  npm run dev
- Lint:
  npm run lint
- Unit tests (Vitest):
  npm test
- Run a single test file (Vitest):
  npm test -- app/path/to/component.test.js
  # or: npx vitest path/to/test --run
- Watch tests:
  npm run test:watch
- E2E (Playwright):
  npm run test:e2e  # requires backend running on :8080
- Build/serve production:
  npm run build && npm start

CI
- The CI workflow mirrors these steps; see .github/workflows/ci.yml for exact stages.

---

## 3) High-level architecture (big picture)

Backend
- Organized by feature (DDD): each feature commonly contains application/, domain/, infrastructure/, presentation/.
- Request pipeline: RateLimitingFilter → JwtAuthenticationFilter (HS256, consults Redis blacklist) → Controller → Application service → Repository.
- Persistence: PostgreSQL is runtime DB. Flyway migrations are the source of truth (src/main/resources/db/migration). Tests use H2 (test resources) and typically bypass production Flyway path.
- Cross-cutting: security, config, event, util, resilience4j (circuit breakers/retries/timeouts) for external services.
- AI infra: ai/ contains ONNX embedding adapter and ChatProvider strategy abstraction; absence of ONNX model files triggers fallback embedding logic.

Frontend
- Next.js App Router under app/ (client+server components). Shared client-only axios client at app/lib/api.js — it reads window.localStorage at request time and redirects to /shop-login on 401 for non-auth endpoints.
- State: AuthContext, CartContext; hooks in app/hooks/.
- Tests: Vitest for unit tests; Playwright for E2E. Playwright config is in frontend-next/playwright.config.js; e2e expects the backend on :8080.

Infra
- docker-compose.yml at repo root defines Postgres 16 and Redis 7 used for local development and mirrored by CI.

---

## 4) Key conventions and patterns (repo-specific)

- Frontend is JavaScript (not TypeScript). Do not convert files to .ts without a repo-wide decision.
- Path alias: @/* -> app/* configured in jsconfig.json and vitest config — use consistently.
- Single Axios client: app/lib/api.js is the canonical HTTP client; do not import it from server components (it accesses window.localStorage).
- Tests colocated with sources on frontend: app/**/*.{test,spec}.{js,jsx}.
- Flyway-first: any DB schema or entity changes MUST have a Flyway migration; runtime disables Hibernate DDL (spring.jpa.hibernate.ddl-auto=none).
- ONNX model files are intentionally not in VCS; scripts/download-models.sh is referenced but not committed.
- ESLint config intentionally allows <img> and raw JSX punctuation from legacy CRA port.

---

## 5) Security, operational, and maintenance hotspots

1. Secrets and env vars
   - README/SETUP/ application.properties may contain placeholders. Ensure JWT_SECRET_KEY (env) is >= 32 bytes and not used in source. Search for default dev secrets.
2. Redis dependency
   - JwtAuthenticationFilter consults Redis blacklist. If Redis is unreachable, requests may fail or logout may be inconsistent. docker-compose helps local dev; CI must provide a Redis instance or use an in-memory fallback if intended.
3. Flyway migrations
   - Flyway is authoritative; missing migrations are a common cause of runtime errors on new field additions. Add migration files to src/main/resources/db/migration and ensure CI applies them.
4. ONNX models and AI features
   - Model files are excluded from VCS; absence triggers fallback. If deterministic, create a documented acquisition step or CI artifact storage.
5. Startup fragility
   - Backend fails fast if Postgres/Redis are unreachable. Document local dev startup order or add health-check retries/backoff.
6. Third-party dependency risk
   - Frontend and backend dependencies should be periodically scanned for CVEs. Pinning and lockfiles exist (package-lock.json, pom.xml).

---

## 6) CI and workflow notes

- CI workflow (.github/workflows/ci.yml) mirrors local commands: starts infra, builds backend and frontend, runs tests. Consult it for exact environment variables and steps.
- Recommended: ensure CI provides Postgres and Redis or uses test profiles that swap to H2 and mock Redis where appropriate.

---

## 7) AI, embeddings, chat, and models

- ONNX models referenced at classpath: models/all-MiniLM-L6-v2.onnx and models/tokenizer.json — these are not in VCS due to size and are gitignored.
- Behavior: If ONNX is absent, embeddings fall back to a hash-based similarity algorithm. Chat uses a pluggable ChatProvider (openrouter by default) and reads AI_CHAT_PROVIDER / AI_CHAT_API_KEY environment variables.
- Action: add a documented model-download step (scripts/download-models.sh) as part of setup or CI artifact retrieval. Consider storing models in an accessible artifact store for CI.

---

## 8) Tests and quality

- Backend unit tests: JUnit 5 + Mockito + MockMvc. Controller tests use MockMvc with test application.properties that point to H2.
- Coverage: JaCoCo runs with mvn test.
- Frontend unit tests: Vitest + Testing Library. vitest.setup.js includes localStorage shim and next/navigation mocks.
- E2E: Playwright tests rely on backend at :8080 and sometimes require seeded data (user accounts). E2E must be run against either seeded DB or a reset test DB.

---

## 9) Files and locations to review (short checklist)

- backend/shelfToTales/src/main/resources/application.properties  (runtime DB/redis/jwt defaults)
- backend/shelfToTales/pom.xml (deps, plugin config, jacoco)
- backend/shelfToTales/src/main/resources/db/migration/ (Flyway migrations)
- backend/shelfToTales/src/main/java/com/example/shelftotales/security/ (JwtAuthenticationFilter, RateLimitingFilter, util/TokenBlacklist)
- frontend-next/app/lib/api.js (axios client behavior)
- frontend-next/playwright.config.js (e2e assumptions)
- .github/workflows/ci.yml (CI steps/ENV)
- SETUP_GUIDE.md, DOCKER.md, CLAUDE.md, AGENTS.md (operational notes and agent guidance)

---

## 10) Prioritized recommendations (short actionable list)

1. Document required environment variables and minimal lengths (JWT_SECRET_KEY >= 32) in SETUP_GUIDE.md and README.md.
2. Add or commit a source-of-truth model-install script (scripts/download-models.sh) or add a CI artifact step to fetch ONNX files when required.
3. Add health-check and retry logic or clearer startup docs to reduce "backend fails on missing Postgres/Redis" pain.
4. Create a lightweight script to seed DB for e2e tests (or document exact seed steps) so Playwright E2E can be run reproducibly.
5. Add a periodic dependency vulnerability scan (Dependabot or GitHub Actions) for both backend and frontend.
6. Consider a small integration test in CI that runs flyway:migrate then starts the app and hits an authenticated endpoint (sanity check).
7. Centralize environment examples (.env.example already exists for frontend) and add backend .env.example with required vars.

---

## 11) Quick commands cheat sheet (copyable)

- Start infra: docker compose up -d
- Backend single test class: ./mvnw test -Dtest=FollowServiceTest
- Backend single test method: ./mvnw test -Dtest=OrderServiceTest#placeOrder_succeeds
- Frontend single test file: npm test -- app/path/to/test.file
- Run Playwright e2e: cd frontend-next && npm run test:e2e (backend must be on :8080)

---

## 12) How to use this file as memory

- This file is intentionally concise and indexed; other models or sessions can load it as a single artifact to avoid re-parsing the codebase.
- Recommended memory facts to extract programmatically: repo shape, build commands, DB runtime requirements, Flyway location, AI model facts, and E2E assumptions listed at the top of this document.

---

## 13) Appendix: Important repo documents (for deeper reading)

- SETUP_GUIDE.md
- DOCKER.md (backend/Dockerfile location and notes)
- CLAUDE.md (operational notes and gotchas)
- AGENTS.md (local agent guidance; gitignored)
- .github/workflows/ci.yml
- frontend-next/playwright.config.js
- backend/shelfToTales/src/main/resources/db/migration/


---

End of audit. Use this file as the canonical short-memory for subsequent agents or sessions; ask for a follow-up targeted audit (security, dependencies, or test coverage) if needed.
