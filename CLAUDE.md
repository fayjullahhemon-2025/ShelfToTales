# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository

Full-stack bookstore + reader community. Monorepo with two independent projects — no root build.

- `backend/shelfToTales/` — Spring Boot 3.4 / Java 17 / Maven (`./mvnw`)
- `frontend-next/` — Next.js 15.5 / React 19 (JavaScript, not TypeScript)
- `docker-compose.yml` (repo root) — Postgres 16 + Redis 7. **Use this one, not the duplicate in `backend/`.**

Local-only files (gitignored, do not commit): `AGENTS.md` (deep ref notes), `docs/`, `scripts/`, `*.onnx` model files. `CLAUDE.md` is now versioned — this file is committed to the repo.

**Runtime versions** (mirrored from `.github/workflows/ci.yml`): JDK 17, Node 20, npm with `legacy-peer-deps=true` (pinned in `frontend-next/.npmrc` — don't pass `--legacy-peer-deps` manually). The backend uses the committed `./mvnw` wrapper; CI does `chmod +x mvnw` defensively.

**Doc-trust hierarchy** — multiple docs contradict each other. Prefer in this order:
1. `backend/shelfToTales/src/main/resources/application.properties` (runtime config truth).
2. `.github/workflows/ci.yml` (CI truth — mirrors local commands).
3. `AGENTS.md` (deep ref notes, post-audit corrections).
4. `CLAUDE.md` (this file — quick ref).
5. `README.md` and `SETUP_GUIDE.md` are **stale on several points** (dev DB, layer layout, AI defaults, DB name `shelftotales` vs actual `shelftotalesdb`) — verify against `application.properties` before acting on them.

CI does **not** run lint — only compile, test, and build.

## Working agreements

- When changing `application.properties` or `ci.yml`, update this file in the same commit — it is the quick-ref and will lie otherwise.
- The "Gotchas" section is a journal. Add to it when you hit a non-obvious failure mode, even if you fix it; future instances hit the same wall.
- `AGENTS.md` is the long form. Treat changes there as audit-grade — if you correct something in AGENTS, check whether this file also says the wrong thing.
- `AGENTS.md`, `docs/`, `scripts/`, and `*.onnx` are gitignored locally. Don't re-add them to commits. `CLAUDE.md` is versioned and should be committed.
- `.github/copilot-instructions.md` exists and is NOT gitignored. If you find a contradiction with this file, the doc-trust hierarchy above wins.

## Adding a new endpoint — checklist

1. Controller in the right feature module's `presentation/` package.
2. Service in `application/`; entity fields must already exist in Flyway (add a `V##__…sql` migration first if not).
3. Is the path state-changing and in a new category? Add a branch in `RateLimitingFilter` — `/api/<new>/*` won't match the existing prefixes automatically.
4. Is it behind auth? Default-deny in `SecurityConfig`; the JWT filter handles the rest, but confirm `permitAll()` isn't accidentally covering the path.
5. Frontend caller: use `app/lib/api.js` from a client component, or plain `fetch` for public reads (the axios client force-redirects to `/shop-login` on 401).
6. Add a row to the "Key API endpoints" table below.

## Stack — what's actually wired (not what the README says)

- **Backend DB is PostgreSQL, not H2.** `backend/shelfToTales/src/main/resources/application.properties` defaults to `jdbc:postgresql://localhost:5432/shelftotalesdb`. H2 is **test-scope only** (test resources swap to H2 + `ddl-auto=create-drop` + Flyway disabled). The root `README.md` and `backend/shelfToTales/DOCKER.md` are stale on this point — trust `application.properties`.
- **Redis is required at runtime** for the JWT token blacklist and the optional `CACHE_TYPE=redis` mode. `CACHE_TYPE=simple` (in-memory) is the default and works without Redis for the cache, but the auth filter still calls Redis-backed blacklist code, so Redis must be reachable.
- **Flyway runs 75 migrations** on backend boot (`src/main/resources/db/migration/V1__…V75__…sql`). Schema is Flyway's, not Hibernate's (`spring.jpa.hibernate.ddl-auto=none`). Seeded users: `admin@shelftotales.com / Admin123!` and `user@shelftotales.com / User123!`. Last migrations: V70 adds `security_events.request_id`; V71 creates `spoiler_assessments` (sentence-level JSONB); V72 creates `book_chunks` for RAG (conditional HNSW); V73 adds spam-detection columns; V74 creates `book_spoiler_models`; V75 creates `moderated_reviews`.
- **AI features**: local ONNX embeddings need `models/all-MiniLM-L6-v2.onnx` + `models/tokenizer.json` on the classpath. `scripts/download-models.sh` is referenced by `SETUP_GUIDE.md` and `AIConfig.java` but is gitignored — see `.gitignore` (the `*.onnx` files and `backend/shelfToTales/src/main/resources/models/` are excluded). Without the model, embeddings fall back to hash-based similarity. AI chat defaults to OpenRouter (`AI_CHAT_PROVIDER=openrouter`); set `AI_CHAT_API_KEY` for OpenAI, or `AI_CHAT_PROVIDER=none` to force the rule-based path.
- **AI subsystems in this repo**:
  - `ai/application/EmbeddingService` + `ai/application/AIService` — ONNX runtime + heuristic helpers, pgvector-aware.
  - `ai/application/chat/` — Strategy pattern: `ChatProvider` interface with `OpenAIChatProvider` (5s timeout via `RestTemplateConfig`, OpenRouter `HTTP-Referer`/`X-Title` headers) and `RuleBasedChatProvider` fallback. `ChatService` is in-memory session-scoped (per-user, 30 min TTL, max 10 history).
  - `ai/rag/` — `TextChunker` (sentence-aware sliding window), `EmbeddingIndexer` (idempotent reindex), `RagRetriever` (pgvector + MMR rerank), `PromptOrchestrator` (token-budget aware context injection). `ChatService` is wired through `RagRetriever`.
  - `ai/` spoiler pipeline (`ai/README.md` is the canonical diagram) — four pluggable strategies selected by `ai.spoiler.provider` + book-model registry:
    - `heuristic` (`HeuristicSpoilerClassifier`) — weighted regex, sentence-level, default.
    - `llm` (`LlmSpoilerClassifier`) — OpenRouter/OpenAI JSON-mode, gated by `@ConditionalOnProperty(ai.spoiler.provider=llm)`.
    - `book-llm` — local fine-tuned Ollama model per book, auto-falls back to `llm`/`heuristic`. Threshold for triggering Colab fine-tuning is `ai.spoiler.min-training-reviews` (default 3). Webhook/Colab wiring in `ai/application/ColabTrainingService` + `ai/presentation/TrainingWebhookController`.
    - `rag` — vector-store context similarity via `ai/rag/`.
    - `TransformerSpoilerClassifier` (ONNX + DistilBERT) — independent tier, enabled by `ai.spoiler.transformer.enabled=true`, distinct from the strategy switch above. Reads `classpath:models/spoiler-detector.onnx` + `models/tokenizer.json`.
  - `ai/application/SpoilerDetectionService` orchestrates; `ai/presentation/SpoilerController` exposes `POST/GET /api/reviews/{id}/spoiler(-check)`. The review row's `spoiler_level` column (SAFE / MINOR_SPOILER / MAJOR_SPOILER) is server-derived and persisted on every submission.
  - Spam detection — `ai/application/SpamDetectionService` + `SpamClassifier` (`LlmSpamClassifier` when `ai.spam.provider=llm`; default); `ai/application/ReviewModerationService` and `moderated_reviews` table (V75) are the moderation queue. Flagged reviews get `[REDACTED]` on major spoilers per the AI README.
  - `recommend/` — multi-signal ranker. `ContentBasedRanker` (cosine over `EmbeddingService`), `CollaborativeRanker` (item-item Jaccard over `reviews`), `MoodRanker` (tag overlap). `RankingService` blends with weights from `recommendation.weights.{content,collaborative,mood}` and caches per-user results in Redis (`rec:for-you:{userId}`, 1h TTL).
- **Frontend is JavaScript, not TypeScript** despite `typescript` being in devDependencies. Ported 1:1 from a CRA app — most pages still use plain `<img>`, `react-bootstrap`, and `framer-motion`. ESLint explicitly disables `@next/next/no-img-element` and `react/no-unescaped-entities` (`frontend-next/eslint.config.mjs`).
- **Spoiler detection is being migrated from OpenAI heuristic to a fine-tuned local Ollama model** (`shelf-spoiler-detector`). The legacy `ai/spoiler/` path (heuristic + LLM classifier with `spoiler_level` column) is still wired and rate-limited; the new path uses Spring AI `ChatClient` + `BeanOutputConverter` returning `SpoilerAnalysisResponse{isSpoiler, reasoning}`. Both write a `boolean is_spoiler` flag; the new path does not populate `spoiler_level`.

## Commands (mirror `.github/workflows/ci.yml`)

### Backend (`backend/shelfToTales/`)

```bash
# one-time: start infra from repo root
docker compose up -d

# compile
./mvnw -B -ntp -DskipTests compile

# dev run (default profile; add -Dspring-boot.run.profiles=dev for verbose SQL)
./mvnw spring-boot:run

# all tests
./mvnw -B -ntp test

# single test class / method
./mvnw test -Dtest=FollowServiceTest
./mvnw test -Dtest=OrderServiceTest#placeOrder_succeeds

# production
./mvnw clean package -DskipTests
java -jar target/shelfToTales-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

Tests use H2 from `src/test/resources/application.properties` — no live DB needed.

### Frontend (`frontend-next/`)

```bash
# required — .npmrc pins legacy-peer-deps, do NOT pass --legacy-peer-deps manually
npm install

npm run dev           # http://localhost:3000
npm run lint          # eslint (flat config)
npm test              # vitest run
npm test -- app/path/to/component.test.js   # single test file
npm run test:watch    # vitest watch
npm run test:e2e      # playwright — manages its own dev server, but backend must be on :8080
npm run build         # production
npm start             # serve production build
```

Set `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8080/api`) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in `.env.local` — copy from `.env.example`.

## Architecture

### Backend — DDD by feature

Each feature module under `src/main/java/com/example/shelftotales/<feature>/` follows the same four layers:

```
<feature>/
  application/    # @Service classes, DTOs, use-case orchestration
  domain/         # @Entity, value objects, domain events
  infrastructure/ # JPA repositories, external clients (R2/S3, ONNX, OpenRouter)
  presentation/   # @RestController
```

Top-level cross-cutting: `shared`, `event`, `config`, `security` (and the legacy `controller/`, `model/`, `dto/`, `exception/`, `observer/`, `util/` packages which some features still use for non-feature classes like `User` and `Book`). Don't trust `README.md`'s layer diagram — it shows the legacy package layout, not the per-feature DDD layout.

Request flow: `RateLimitingFilter` → `JwtAuthenticationFilter` (consults Redis blacklist) → controller/service/repository.

Cross-cutting:
- `shared/security/RateLimitingFilter` — Bucket4j token bucket per IP, in-memory. Has a long prefix chain (`/api/social/*`, `/api/admin/*`, `/api/ai/chat`, `/api/reviews/`, …) — new state-changing endpoint categories need a new branch here or they share the catch-all "other" bucket.
- `shared/security/JwtAuthenticationFilter` — HS256 JWT (JJWT). Consults Redis blacklist on every request.
- `shared/util/TokenBlacklist` — Redis-backed.
- **Resilience4j**: `google` instance (circuit breaker + 5s time limiter + 3-attempt retry); `orderCheckout` (2-attempt retry on `OptimisticLockingFailureException` / `TransientDataAccessException`).
- `ai/` — ONNX embedding service + pluggable `ChatProvider` (Strategy: none / openai / openrouter).
- **Lombok** is on the compile annotation processor path; entities/DTOs use `@Builder`.

### Frontend

- **App Router** under `app/`; every route directory is a page. Notable groupings: `app/admin/{books,categories,coupons,dashboard,orders,users}/` and `app/community/…`-style features.
- `app/lib/api.js` is the **single axios client** (`'use client'`). Attaches `Bearer` from `localStorage.token` and force-redirects to `/shop-login` on 401 from non-auth endpoints. **Never import from a server component** (it touches `window.localStorage` at request time). When state changes succeed, the SPA relies on `Authorization: Bearer <jwt>` only — CSRF is intentionally disabled in `shared/config/SecurityConfig.java`. If you re-enable CSRF, you must also wire this client to echo the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN` or every mutation will 403.
- State: `app/contexts/{AppContext,AuthContext,CartContext,LofiContext}.js`; data hooks in `app/hooks/{useApi,useAuth,useBookshelves,useCart,useWishlist}.js`. `AuthContext` is client-only — wrap consumers in `app/components/ClientOnly.js` to avoid SSR hydration warnings.
- Real-time: `@stomp/stompjs` + `sockjs-client` (WebSocket).
- Path alias: `@/*` → `app/*` (`jsconfig.json` and `vitest.config.mjs`).
- Tests colocated next to source: `app/**/*.{test,spec}.{js,jsx}`. `e2e/` is Playwright-only — vitest is configured to ignore it.

### Key API endpoints

| Endpoint | Returns |
|----------|---------|
| `GET /api/dashboard` | `DashboardResponse` — reading stats, currently reading, recommendations, cart/wishlist counts |
| `GET /api/streaks` | `ReadingStreak` — current streak, longest streak |
| `GET /api/goals/active` | `ReadingGoalResponse` — annual reading goal progress |
| `GET /api/achievements/mine` | `List<UserAchievement>` — earned badges |
| `GET /api/challenges/mine` | `List<UserChallenge>` — joined challenges |
| `GET /api/feed/following` | `Page<ActivityFeedItem>` — social feed (quotes, reviews) |
| `GET /api/social/following` | `Page<FollowResponse>` — followed users |
| `GET /api/rooms` | `List<ReadingRoom>` — virtual reading rooms |
| `GET /api/books/mood/{mood}` | `List<BookResponse>` — books by mood tag |
| `POST /api/books/{id}/reviews` | `ReviewResponse` — now includes `spoilerLevel`, `spoilerScore`, `sanitizedComment` |
| `POST /api/reviews/{id}/spoiler-check` | `SpoilerAssessmentResponse` — re-runs the classifier (heuristic or LLM) |
| `GET  /api/reviews/{id}/spoiler` | `SpoilerAssessmentResponse` — latest persisted assessment |
| `GET  /api/recommendations/for-you` | `List<Recommendation>` — blended ranking for the current user |
| `GET  /api/recommendations/mood/{mood}` | `List<Recommendation>` |
| `GET  /api/recommendations/similar/{bookId}` | `List<Recommendation>` |
| `POST /api/ai/chat` | `ChatResponse` — reply + book recommendations (rate-limited as category `ai`) |
| `POST /api/books/search-by-image` | `List<BookResponse>` — multipart upload, dHash + Hamming, threshold ≤ 8 |
| `GET /api/search` | `UnifiedSearchResponse` — text + semantic merged via RRF (k=60). Query: `q`, `page`, `size`, `sortBy`, `sortDir`. Per-signal degradation reported in `signals.{text,semantic}`. |

## Testing

- **Backend**: JUnit 5 + Mockito. Default scope is unit tests with mocks; controllers use MockMvc. `app.security.require-https=false` is forced in test resources so MockMvc over plain HTTP works. JWT secret in tests is a fixed string in `src/test/resources/application.properties` — never reuse in prod. Coverage: `jacoco-maven-plugin` runs on `mvn test`; report at `target/site/jacoco/index.html`.
- **Frontend unit**: Vitest + jsdom + Testing Library. `vitest.setup.js` (a) injects a `localStorage` shim (jsdom 25 drops it in some configs), (b) mocks `next/navigation` and `next/link`.
- **Frontend E2E**: Playwright config assumes the backend is already running on `:8080` (it only manages the Next dev server). `npm run test:e2e` does not bootstrap the DB — some specs require a seeded user.

## Gotchas

- Backend startup fails fast if Postgres isn't reachable on `:5432` or Redis on `:6379` — start `docker compose up -d` from the repo root first.
- **Flyway is the schema source of truth.** Don't add `@Entity` fields without a migration — Hibernate will not create the column. The `request_id` column on `security_events` was a previous regression: it was added to the JPA entity without a V70 migration, which would have made the table write path fail on first deploy.
- `JWT_SECRET_KEY` env var must be ≥32 bytes; the dev default in `application.properties` is an empty string (`${JWT_SECRET_KEY:}`), so it must be set or startup will fail.
- `app/lib/api.js` reads `window.localStorage` at request time; do not call it during SSR.
- **CSRF is intentionally disabled** in `shared/config/SecurityConfig.java` — the SPA sends `Authorization: Bearer <jwt>` only. If you re-enable CSRF, wire the frontend axios client to echo the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`; otherwise every state-changing request will 403.
- `MdcLoggingFilter` sanitizes the inbound `X-Request-ID` against `^[A-Za-z0-9._-]{1,64}$` and replaces anything else with a fresh UUID. Only the sanitized value is echoed in the response header and persisted to `security_events.request_id`. Don't add fields that copy the raw header.
- CORS is locked to `CORS_ALLOWED_ORIGINS` (default `http://localhost:3000`); 403s on the frontend almost always mean an origin mismatch, not an auth problem.
- Resilience4j in test context is loaded but harmless — don't tear it out.
- `RateLimitingFilter` has a long prefix chain (`/api/social/*`, `/api/admin/*`, `/api/ai/chat`, `/api/reviews/`, …). New state-changing endpoint categories need a new branch here or they will share the catch-all "other" bucket.
- `.gitignore` already excludes `AGENTS.md`, `docs/`, `scripts/`, `frontend/`, audit reports, and `*.onnx` model files. Don't add them to commits. `CLAUDE.md` is versioned.
- **Frontend is JavaScript, not TypeScript** despite `typescript` being in devDependencies. ESLint explicitly disables `@next/next/no-img-element` and `react/no-unescaped-entities` (`frontend-next/eslint.config.mjs`); don't add new pages that re-enable these warnings.

## Where to look first when something breaks

- Backend won't start → `backend/shelfToTales/src/main/resources/application.properties`, then `target/` for previous-run output.
- 401s after login → `util/TokenBlacklist` (Redis connectivity) or `JWT_SECRET_KEY` rotation invalidating existing tokens.
- Frontend hydration warnings on auth pages → `AuthContext` is client-only; wrap consumers in the existing `ClientOnly` helper (`app/components/ClientOnly.js`).
- AI chat returns the rule-based fallback unexpectedly → check `AI_CHAT_API_KEY` is set and `AI_CHAT_PROVIDER` is not `none`; logs come from `com.example.shelftotales.ai`.
- Spoiler detection on review submission runs synchronously and inside the same transaction; failures are caught and logged so submission never blocks. If `spoiler_level` looks stuck on SAFE, verify `ai.spoiler.provider` and that `LlmSpoilerClassifier` is being picked (it's `@ConditionalOnProperty(ai.spoiler.provider=llm)`).
- RAG retrieval returns empty → `book_chunks` is empty until `EmbeddingIndexer.reindexAll()` runs. There is no scheduled job yet; trigger it once after deploy with an admin endpoint, or backfill manually via SQL.
- Migration drift on restart → `docker compose down -v` to wipe the `pgdata` volume, then `./mvnw spring-boot:run`.
- **"Storage not configured" / boot fails with R2 error** → R2 creds missing. Required env vars: `R2_ENDPOINT`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`. The backend now fails fast at boot via `R2HealthCheck` (no silent 503s). `application.properties` still ships dev defaults so `./mvnw spring-boot:run` works locally, but `StorageConfig` logs a WARN when those defaults are in use — set env vars in any non-local environment.
- **Per-room music sync** lives on `/api/rooms/{roomId}/playlist/**` (REST) and `/topic/room/{roomId}/music` (STOMP). The global `playlist_songs` table + `app/admin/lofi/page.js` is a separate "shared library" surface and stays live.
- **Chat submit writes once.** The frontend `send()` in `app/reading-room/[id]/page.js` only publishes STOMP; `ChatWebSocketController.handleChatMessage` is the single persist path. Do not add a second REST call to `readingRoomService.postMessage` from the page — every duplicate POST becomes a duplicate row.
- The unified search endpoint at `/api/search` is rate-limited in its own `search` bucket in `RateLimitingFilter` — a new search sub-endpoint should not assume the catch-all "other" bucket is appropriate.
