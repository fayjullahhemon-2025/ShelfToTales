# Copilot Instructions for ShelfToTales

Purpose: concise, actionable guidance for Copilot-style assistants working in this monorepo.

---

## Quick Commands (Exact)

### Backend (backend/shelfToTales/)

**Setup & Infrastructure**
- Start infra (from repo root):
  ```bash
  docker compose up -d  # Postgres 16 + Redis 7
  ```

**Build & Compile**
- Compile (CI-style):
  ```bash
  ./mvnw -B -ntp -DskipTests compile
  ```
- Build production jar:
  ```bash
  ./mvnw clean package -DskipTests
  java -jar target/shelfToTales-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
  ```

**Development**
- Run dev server:
  ```bash
  ./mvnw spring-boot:run
  ```
- Run dev server with verbose SQL:
  ```bash
  ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
  ```

**Testing**
- Run all tests:
  ```bash
  ./mvnw -B -ntp test
  ```
- Run a single test class:
  ```bash
  ./mvnw test -Dtest=FollowServiceTest
  ```
- Run a single test method:
  ```bash
  ./mvnw test -Dtest=OrderServiceTest#placeOrder_succeeds
  ```
- View coverage report:
  ```bash
  open target/site/jacoco/index.html  # After running tests
  ```

### Frontend (frontend-next/)

**Setup**
- Install deps:
  ```bash
  npm install  # Note: .npmrc pins legacy-peer-deps
  ```

**Development**
- Dev server:
  ```bash
  npm run dev  # http://localhost:3000
  ```

**Linting**
- Lint:
  ```bash
  npm run lint
  ```

**Testing**
- Run all unit tests (Vitest):
  ```bash
  npm test
  ```
- Run a single test file:
  ```bash
  npm test -- app/path/to/component.test.js
  ```
- Watch mode:
  ```bash
  npm run test:watch
  ```
- Run E2E tests (Playwright):
  ```bash
  npm run test:e2e  # Backend must be reachable at :8080
  ```

**Production**
- Build & serve:
  ```bash
  npm run build
  npm start
  ```

**Configuration**
- Copy environment template:
  ```bash
  cp .env.example .env.local
  ```
- Set required vars in `.env.local`:
  - `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8080/api`)
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (from Google Cloud Console)

**Key Notes**
- `.mvnw` is committed and executable; use it instead of system `mvn` for CI parity.
- Use the **repo-root** `docker-compose.yml` (not the backend one) for Postgres + Redis.
- Frontend `.npmrc` pins `legacy-peer-deps=true`; don't pass `--legacy-peer-deps` manually unless debugging.

---

## High-level Architecture — Concise

### Repository Structure
- Monorepo with two **independent** projects (no root-level build orchestration):
  - `backend/shelfToTales/` — Spring Boot 3.4, Java 17, Maven
  - `frontend-next/` — Next.js 15.5, React 19, JavaScript (not TypeScript)
  - `docker-compose.yml` (repo root) — PostgreSQL 16 + Redis 7

### Backend Architecture (DDD by Feature)

### Backend Architecture (DDD by Feature)

Each feature module under `src/main/java/com/example/shelftotales/<feature>/` follows a consistent four-layer structure:

```
<feature>/
  application/    # @Service classes, DTOs, request/response objects, use-case orchestration
  domain/         # @Entity, value objects, domain events, business logic
  infrastructure/ # JPA repositories, external clients (Google OAuth, AI services, S3)
  presentation/   # @RestController, request mapping
```

**Feature modules** (18 total): `auth`, `bookshelf`, `catalog`, `commerce`, `exchange`, `gamification`, `notification`, `readingroom`, `review`, `social`, `wishlist`, `ai`, `admin`, `blog`, `comparison`, `donation`, `moderation`, `shared`. Plus cross-cutting `event`, `config`, `security`, `controller/`, `model/`, `dto/`, `exception/`, `observer/`, `util/` (legacy packages for shared classes like `User`, `Book`).

**Request flow**:
```
HTTP Request
  ↓
RateLimitingFilter (Bucket4j per-IP token bucket; in-memory)
  ↓
JwtAuthenticationFilter (HS256 via JJWT; checks Redis blacklist on every auth'd request)
  ↓
@RestController (presentation layer)
  ↓
@Service (application layer; orchestrates domain logic)
  ↓
JPA Repository (infrastructure layer)
  ↓
PostgreSQL (or H2 in tests)
```

**Key libraries & patterns**:
- **JWT**: JJWT (Java JWT) for HS256 token creation/validation.
- **Rate Limiting**: Bucket4j in-memory token bucket per IP.
- **Token Blacklist**: Redis (util/TokenBlacklist); checked on every authenticated request to support logout invalidation.
- **Resilience**: Resilience4j with two instances:
  - `google` — Circuit breaker + 5s time limiter + 3-attempt retry (Google OAuth, external APIs).
  - `orderCheckout` — 2-attempt retry on `OptimisticLockingFailureException` / `TransientDataAccessException`.
- **Caching**: Spring Cache abstraction; configurable via `CACHE_TYPE` env var (default: `simple` in-memory; `redis` for distributed).
- **DB Access**: Spring Data JPA + Hibernate (Lombok @Builder for entities/DTOs).
- **Real-time**: WebSocket + Spring WebSocket starter; STOMP protocol for messaging.
- **AI**: ONNX Runtime (local embeddings) + pluggable ChatProvider (Strategy pattern: none / openai / openrouter).
- **Schema**: Flyway migrations (source of truth); Hibernate set to `ddl-auto=none` (never creates columns).

**Database & Schema**:
- **Runtime**: PostgreSQL (JDBC URL: `jdbc:postgresql://localhost:5432/shelftotalesdb`).
- **Tests**: H2 in-memory (swapped in `src/test/resources/application.properties`).
- **Migrations**: 50+ Flyway versioned SQL scripts in `src/main/resources/db/migration/V1__...sql`.
- **Seeding**: Default users (`admin@shelftotales.com` / `Admin123!`, `user@shelftotales.com` / `User123!`) created by migrations.
- **Optimization**: Hikari connection pool (default: max 10 connections, min 5 idle), batch inserts enabled.

**Configuration**:
- **Config files**: `application.properties` (dev defaults) + `application-prod.properties` (if needed) + env var overrides.
- **Key env vars**: `DB_URL`, `JWT_SECRET_KEY` (≥32 bytes), `CORS_ALLOWED_ORIGINS`, `AI_CHAT_API_KEY`, `AI_CHAT_PROVIDER`, `CACHE_TYPE`, `REQUIRE_HTTPS`.
- **Profiles**: `dev` (verbose SQL logging) and `prod` (hardened security, external DB).

**Common patterns to recognize**:
- `@Data`, `@Builder` (Lombok) — on entities/DTOs; reduces boilerplate.
- `@Service` + dependency injection — all business logic is wired via constructor/setter; easy to mock in tests.
- `Optional<T>` — repositories return Optional; respect nullability.
- `@Transactional` — on @Service methods; implicit rollback on exceptions.
- `@RestController` + `@PostMapping`, `@GetMapping` — standard Spring Web conventions.
- Domain events — events emitted from domain layer; listeners in application layer (loose coupling).

**Common backend modifications**:

| Task | Steps | Example |
|------|-------|---------|
| **Add a new entity field** | 1. Create Flyway migration in `src/main/resources/db/migration/VN__description.sql` 2. Add field to `@Entity` with `@Column` 3. Regenerate repository methods if needed | `ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);` |
| **Add a new REST endpoint** | 1. Add `@PostMapping` / `@GetMapping` in `<feature>/presentation/<Feature>Controller` 2. Inject `@Service` dependency 3. Call service method 4. Return DTO | `@PostMapping("/api/books/search")\npublic ResponseEntity<?> search(@RequestBody SearchRequest req) { ... }` |
| **Call external API (with resilience)** | 1. Add `@Resilience4j` annotation to service method 2. Use existing circuit breaker name (`google`, `orderCheckout`) or define new one 3. Handle exceptions gracefully | `@CircuitBreaker(name = "google", fallbackMethod = "fallback")\npublic String getGoogleData() { ... }` |
| **Add caching** | 1. Annotate method with `@Cacheable("cacheName")` 2. Define cache TTL in `application.properties` 3. Use `@CacheEvict` for invalidation | `@Cacheable("books")\npublic List<Book> getAllBooks() { ... }` |
| **Add domain event** | 1. Create event class in `<feature>/domain` extending `DomainEvent` 2. Emit in domain method via `publishEvent()` 3. Create listener in application layer | Event: `UserRegisteredEvent`, Listener: `@EventListener` method |
| **Add WebSocket endpoint** | 1. Extend `WebSocketConfigurer` in config 2. Register handler in `registerWebSocketHandlers()` 3. Implement handler logic | `addHandler(new NotificationHandler(), "/ws/notifications").setAllowedOrigins("*")` |



### Frontend Architecture (App Router)

- **App Router** under `app/` — every route directory is a page.
- Key route groupings: `app/admin/{books,categories,coupons,dashboard,orders,users}/`, `app/community/`, feature-specific routes.
- **Single Axios client** (`app/lib/api.js`, `'use client'`):
  - Automatically attaches Bearer token from `localStorage.token`.
  - Force-redirects to `/shop-login` on 401 from non-auth endpoints.
  - **CRITICAL**: Never import `api.js` from server components (it reads `window.localStorage` at request time).
- **State management**: `app/contexts/AuthContext.js`, `CartContext.js`; data hooks in `app/hooks/*.js`.
- **Real-time communication**: `@stomp/stompjs` + `sockjs-client` (WebSocket).
- **Path alias**: `@/*` → `app/*` (configured in `jsconfig.json` and `vitest.config.mjs`).
- **Tests colocated** next to source: `app/**/*.{test,spec}.{js,jsx}`. E2E tests in `e2e/` (Playwright-only).



---

## Key Repo-Specific Conventions & Gotchas

### Database & Migrations
- **Runtime DB is PostgreSQL** (default: `jdbc:postgresql://localhost:5432/shelftotalesdb`). **H2 is test-only**.
  - Production config via env vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
  - Test config in `src/test/resources/application.properties` (H2 + `ddl-auto=create-drop` + Flyway disabled).
- **Flyway is the schema source of truth** — never rely on Hibernate to create columns.
  - **CRITICAL**: Any new `@Entity` field requires a Flyway migration in `src/main/resources/db/migration/`.
  - Running `./mvnw spring-boot:run` without a migration will fail or leave the schema incomplete.

### Authentication & Security
- **JWT_SECRET_KEY** must be ≥32 bytes in production.
  - Dev default in `application.properties` is a placeholder — change it in env vars before deploying.
- **Redis is required at runtime** for token blacklist (JWT logout invalidation).
  - `CACHE_TYPE=simple` (in-memory) works for caching, but blacklist code still expects Redis connectivity.
  - If Redis is unreachable, 401 errors will occur on authenticated requests after logout.

### AI Features
- **ONNX model files** (`models/all-MiniLM-L6-v2.onnx`, `models/tokenizer.json`) are **intentionally NOT committed** (see `.gitignore`).
  - Without them, embeddings fall back to deterministic hash-based similarity (still functional).
  - To enable real embeddings: download models via `scripts/download-models.sh` (not in repo; ask maintainers) or manually follow `SETUP_GUIDE.md` "AI Features Setup".
- **AI Chat** defaults to OpenRouter (`AI_CHAT_PROVIDER=openrouter`).
  - Set `AI_CHAT_API_KEY` + `AI_CHAT_PROVIDER=openai` to use OpenAI.
  - Set `AI_CHAT_PROVIDER=none` to force rule-based responses (no external API calls).

### Testing
- **Backend tests**: JUnit 5 + Mockito. Run against H2 in-memory DB.
  - No live database required; tests are fast and isolated.
  - Coverage via JaCoCo: `mvn test` generates report at `target/site/jacoco/index.html`.
- **Frontend unit tests**: Vitest + jsdom + Testing Library.
  - `vitest.setup.js` provides `localStorage` polyfill and mocks Next.js router/link.
  - Tests colocated next to source files: `app/**/*.{test,spec}.{js,jsx}`.
- **Frontend E2E tests**: Playwright.
  - Assumes backend is reachable at `:8080` (does NOT start it automatically).
  - Some tests require seeded users; `npm run test:e2e` does NOT bootstrap the database.
  - Start infra and backend before E2E: `docker compose up -d && ./mvnw spring-boot:run` (in separate terminals).

### Frontend-Specific
- **`app/lib/api.js` is client-only** and reads `window.localStorage`.
  - **CRITICAL**: Never import `api.js` from server components (causes hydration errors or runtime crashes).
  - Use server-only API calls or fetch directly from server components.
- **JavaScript, not TypeScript** — despite `typescript` in `package.json`.
  - Codebase was ported 1:1 from Create React App; ESLint disables `@next/next/no-img-element` and `react/no-unescaped-entities`.
  - New code can be JS or TS, but adhere to existing file conventions.
- **CORS is locked** to `CORS_ALLOWED_ORIGINS` (default: `http://localhost:3000`).
  - 403s on the frontend almost always mean origin mismatch, not an auth problem.

### Common Pitfalls
- Do **NOT** add entity fields without creating a Flyway migration — Hibernate will NOT create the column in production.
- Do **NOT** import `app/lib/api.js` from server components.
- Do **NOT** commit ONNX model files, `scripts/download-models.sh`, or `AGENTS.md`/`CLAUDE.md` (already gitignored).
- Backend fails fast if Postgres (`:5432`) or Redis (`:6379`) isn't reachable — always start `docker compose up -d` first.

---

## Where to Look First (By Problem)

### Backend Won't Start
1. Check `backend/shelfToTales/src/main/resources/application.properties` for config truth.
2. Ensure infra is running: `docker compose ps` (expect `postgres` and `redis` running).
3. Check `target/` for previous build errors; `./mvnw clean` if stale artifacts.
4. Run with verbose logging: `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev` (shows SQL, Flyway migrations).

### 401 Errors After Login
1. Verify Redis connectivity: `redis-cli ping` (expect `PONG`).
2. Check `JWT_SECRET_KEY` hasn't been rotated (existing tokens will be invalid).
3. Review `util/TokenBlacklist` logic and Redis logs.

### Frontend Hydration Warnings on Auth Pages
- `AuthContext` is client-only; wrap consumers in `ClientOnly` helper (`app/components/ClientOnly.js`).

### AI Chat Returns Rule-Based Fallback Instead of Real Responses
1. Check `AI_CHAT_API_KEY` is set in env.
2. Verify `AI_CHAT_PROVIDER` is not `none`.
3. Review logs: `com.example.shelftotales.ai` logger.

### Frontend Tests Fail: "Backend not reachable" or 401s
- Ensure backend is running on `:8080` before E2E tests: `./mvnw spring-boot:run` in a separate terminal.
- Database must be seeded: check login credentials are `admin@shelftotales.com / Admin123!` or `user@shelftotales.com / User123!`.

### Schema Out of Sync (Columns Missing After Migration)
- Wipe DB volume: `docker compose down -v` (deletes data).
- Restart: `docker compose up -d && ./mvnw spring-boot:run` (re-runs Flyway migrations).

### CORS 403 Error from Frontend
- Frontend origin must match `CORS_ALLOWED_ORIGINS` (default: `http://localhost:3000`).
- Check `app.cors.allowed-origins` in `application.properties` or override via `CORS_ALLOWED_ORIGINS` env var.

---

## Useful Reference Files (Priority Order)

1. **`backend/shelfToTales/src/main/resources/application.properties`** — runtime config truth; all feature flags and env var defaults.
2. **`.github/workflows/ci.yml`** — CI source of truth; mirrors local build/test/lint commands.
3. **`.github/copilot-instructions.md`** (this file) — Copilot-focused quick reference.
4. **`AGENTS.md` and `CLAUDE.md`** (repo root, gitignored) — deeper notes and audit corrections.
5. **`README.md`, `SETUP_GUIDE.md`, `DOCKER.md`** — helpful but some sections are stale; always verify against `application.properties` and CI.
6. **`frontend-next/vitest.config.mjs` and `playwright.config.js`** — test-specific config.
7. **`frontend-next/eslint.config.mjs`** — linting rules (explicitly disables some Next.js checks to allow JS + `<img>`).

---

## First Steps for New Copilot Sessions

1. **Confirm runtime config**: Read `backend/shelfToTales/src/main/resources/application.properties` to understand DB, Redis, AI provider, cache type.
2. **Start infra**: `docker compose up -d` from repo root (Postgres + Redis).
3. **Mirror CI locally** (if needed): Copy commands from `.github/workflows/ci.yml` for compile/test parity.
4. **For E2E**: Start backend separately before running Playwright (`./mvnw spring-boot:run`).

---

## MCP Servers (Optional)

- **Playwright MCP Server** — Useful for running browser tests autonomously. Expects backend on `:8080`.
  - Configuration: Point to `frontend-next/playwright.config.js` and ensure backend is reachable and seeded (or set up a healthcheck).
  - Alternative: Run `npm run test:e2e` manually after starting infra + backend.

---

## Summary

This file is a living reference for Copilot sessions. It captures the monorepo's exact build/test/lint commands, high-level architecture, key conventions, and common gotchas. Refer to the sections above when starting a new task; consult `application.properties` and `CI.yml` for the latest config truth.
