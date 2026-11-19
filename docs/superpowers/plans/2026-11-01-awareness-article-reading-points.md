# Awareness Hub Article Reading Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Award each resident 5 SAB-Points once per eligible Awareness Hub article after a qualifying read, with a server-enforced 20-second minimum and a three-award daily limit.

**Architecture:** Add server-tracked reading sessions and unique article-award records; atomically create the positive points-ledger entry when a qualifying article is completed. Extend the existing Awareness Hub modal to require 20 seconds and scrolling to the article end, and display server-derived award status, success, and daily-cap feedback.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Pytest with SQLite `StaticPool`, Next.js, React, TypeScript, Vitest.

**Spec:** [docs/superpowers/specs/2026-11-01-awareness-article-reading-points-design.md](../specs/2026-11-01-awareness-article-reading-points-design.md)

## Global Constraints

- PostgreSQL remains the primary database; every schema change uses an Alembic migration.
- Pytest keeps its in-memory SQLite `StaticPool` fixture.
- Resident-role sessions are required; all state-mutating reading endpoints, including opening a read session, enforce the existing CSRF dependency.
- The backend allowlist includes only `article-sdgs-sabtrack`, `article-ra-9003`, and `article-home-composting`.
- Keep the current three eligible articles; do not add another article or award video synopsis views. The daily-cap response is forward-compatible; after earning all three current articles, no current article remains eligible for points.
- The server owns `opened_at`, the 20-second minimum, award idempotency, ledger balance updates, and the Asia/Manila daily cap; never trust a client-supplied open timestamp.
- Award exactly 5 positive ledger points, at most once per resident/article and at most three article awards per Asia/Manila calendar day.
- At the daily limit, award nothing and do not mark the article completed; the resident can reread it on a later day under the cap.
- Reopening an unfinished article replaces its session; sessions do not expire by time. A daily-cap completion consumes the session, requiring a fresh open and read on a later day.
- Scroll-to-end is a frontend usability gate and is not represented as a server-verifiable security guarantee.
- Preserve the existing visual style and unrelated dirty worktree changes. Do not commit unless explicitly requested.

## Review Focus

- Replayed completions must not create duplicate article awards, and simultaneous requests must serialize through the resident lock — test replay idempotency in Task 1; SQLite tests do not establish live PostgreSQL lock contention.
- A forged, unknown, or another resident's session/article must not produce points — test in Task 1 with invalid article/session ownership.
- A request under 20 seconds must fail based on server time even if the client says it waited — test in Task 1 by submitting immediately and by manipulating client payload fields.
- Daily-limit counting must switch at Philippine midnight, not UTC midnight — test in Task 1 with UTC timestamps that fall on different Asia/Manila dates.
- Closing/reopening or opening the same article in two tabs must make only the latest server session valid — test in Task 1 for session replacement; test the reader flow in Task 2.

---

### Task 1: Server-Tracked Article Awards

**Files:**
- Modify: `apps/api/app/modules/gamification/models.py`
- Modify: `apps/api/app/modules/gamification/schemas.py`
- Modify: `apps/api/app/modules/gamification/service.py`
- Modify: `apps/api/app/api/v1/endpoints/gamification.py`
- Create: `apps/api/alembic/versions/0012_awareness_article_reading.py` (confirm revision identifier does not conflict with current head)
- Create: `apps/api/tests/test_awareness_article_rewards.py`
- Reuse: `apps/api/tests/conftest.py`

**Interfaces:**
- Consumes: `get_current_user`, `verify_csrf`, `get_db`, `PointsLedger`, `TransactionType`, `User`, and existing `api_router` conventions.
- Produces:
  - `POST /api/v1/gamification/article-reading/open`, body `{ "article_id": string }`, returning `{ "article_id": string, "session_id": string | null, "opened_at": datetime | null, "already_read": boolean }`.
  - `GET /api/v1/gamification/article-reading/status`, returning `{ "completed_article_ids": string[], "awards_today": number, "daily_limit": 3, "points_per_article": 5, "minimum_read_seconds": 20 }`.
  - `POST /api/v1/gamification/article-reading/complete`, body `{ "session_id": string }`, returning `{ "article_id": string, "status": "AWARDED" | "ALREADY_READ" | "DAILY_LIMIT_REACHED", "points_awarded": number, "awards_today": number }`. Early completion is an explicit client error and creates no award.
  - `ArticleReadingSession` with server-owned open time, replaceable session ID, consumed state, and one current session per resident/article.
  - `ArticleReadAward` with a unique constraint on `(resident_id, article_id)` and a reference to its ledger entry.
  - `TransactionType.ARTICLE_READ_AWARD`.

- [ ] **Step 1: Write failing API tests**

Add focused tests:

- `test_resident_can_open_eligible_article_and_read_status_reports_progress`
- `test_reading_routes_require_resident_role_and_csrf`
- `test_completion_rejects_unknown_article_and_wrong_owner_session`
- `test_completion_rejects_before_server_minimum_time`
- `test_completion_awards_five_points_and_records_ledger_entry`
- `test_repeat_completion_never_awards_twice`
- `test_daily_limit_consumes_session_and_allows_later_day_reread` (extend the eligible-article allowlist in the isolated test to simulate a future fourth article without adding one to the product)
- `test_daily_limit_uses_asia_manila_midnight`
- `test_reopening_article_replaces_prior_session`

Assert both the unique award record and ledger sum/transaction type. Repeat the completion request and assert there is still one award and one ledger entry. The SQLite fixture verifies deterministic idempotency and date boundaries; it does not prove PostgreSQL row-lock behavior under live concurrent transactions.

- [ ] **Step 2: Run tests to verify they fail for the missing feature**

Run: `cd apps/api; .\.venv\Scripts\python.exe -m pytest tests\test_awareness_article_rewards.py -q`
Expected: FAIL because the reading endpoints/models do not exist; fix test/import setup errors until the failures identify missing behavior.

- [ ] **Step 3: Add model and migration**

Add the two reading tables and foreign keys, including `UniqueConstraint("resident_id", "article_id")` on article awards. Add the string-backed ledger transaction type; use the existing `PointsLedger` table for points, and use server-generated UUID session IDs. The migration must not introduce SQLite production fallback or seed synthetic residents/articles.

- [ ] **Step 4: Add schemas and service operations**

Implement `open_article_reading_session(db: Session, resident_id: int, article_id: str) -> ArticleReadingSessionRead`, `get_article_reading_status(db: Session, resident_id: int) -> ArticleReadingStatus`, and `complete_article_reading(db: Session, resident_id: int, session_id: UUID) -> ArticleReadingCompletion`. If the article is already awarded, the open response has `already_read=true` and null session/time fields. Keep the allowlist fixed to the three eligible IDs. On reopen, replace the current session ID and `opened_at` and clear consumed state. On completion, lock the resident, validate ownership, unconsumed state, and at least 20 server-measured seconds, count today's reading ledger entries using Asia/Manila calendar boundaries, and atomically insert the unique award plus a `+5 ARTICLE_READ_AWARD` ledger entry. A completed article must never be awarded again; return `ALREADY_READ`. If the cap is three, return `DAILY_LIMIT_REACHED`, persist no award or completion record, and consume the current session so the resident must open/read the article again later.

- [ ] **Step 5: Add resident-only API routes**

Expose the three exact paths and response shapes above. Require `require_role(UserRole.RESIDENT)` on all three endpoints and `verify_csrf` on both POST endpoints, including session opening. Translate unsupported article IDs and invalid sessions to non-sensitive client errors; return an explicit early-completion error and the distinct daily-cap result.

- [ ] **Step 6: Run backend tests to verify they pass**

Run: `cd apps/api; .\.venv\Scripts\python.exe -m pytest tests\test_awareness_article_rewards.py -q`
Expected: PASS, including ledger/idempotency and daily-boundary assertions.

- [ ] **Step 7: Run existing gamification and backend regression tests**

Run: `cd apps/api; .\.venv\Scripts\python.exe -m pytest tests\test_gamification_rewards.py tests\test_gamification.py tests\test_awareness_article_rewards.py -q`
Expected: PASS; existing reward and participation behavior remains unchanged.

### Task 2: Awareness Hub Reading Flow

**Files:**
- Modify: `apps/web/src/app/resident/awareness/page.tsx`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/web/src/types/gamification.ts` or add `apps/web/src/types/awareness.ts` if that keeps the API contracts clearer
- Modify: `apps/web/tests/AwarenessHub.test.tsx`
- Modify: `docs/DEVELOPMENT_SETUP.md` only if the existing Awareness Hub usage section needs to document the reward rule

**Interfaces:**
- Consumes: Task 1's `open`, `status`, and `complete` routes and their response fields; existing `getMyPointsSummary()` and error handling conventions.
- Produces: typed `getArticleReadingStatus()`, `openArticleReading(articleId)`, and `completeArticleReading(sessionId)` helpers; a modal flow with timer, scroll gate, badge, daily-cap notice, and award confirmation.

- [ ] **Step 1: Write failing UI/API-client tests**

Extend `AwarenessHub.test.tsx` with these behavior tests:

- `test_banner_explains_article_reward_rule`
- `test_completed_articles_show_read_badge`
- `test_opening_article_starts_server_session`
- `test_mark_as_read_requires_timer_and_scroll_end`
- `test_success_awards_five_points_and_refreshes_summary`
- `test_daily_limit_keeps_article_unread_and_shows_message`
- `test_video_synopsis_does_not_start_read_session`
- `test_reading_status_error_is_surfaced`

- [ ] **Step 2: Run focused frontend tests to verify they fail**

Run: `cd apps\web; cmd.exe /c npm test -- tests/AwarenessHub.test.tsx`
Expected: FAIL on missing reading reward behavior, not test setup errors.

- [ ] **Step 3: Add typed API helpers and contracts**

Define `ArticleReadingStatus`, `ArticleReadingSession`, and `ArticleReadingCompletion` matching Task 1 exactly. Add `ARTICLE_READ_AWARD` to the frontend `TransactionType` union and API helpers using `apiFetch`; do not store or accept an `opened_at` value from the browser as proof of elapsed time.

- [ ] **Step 4: Implement article modal requirements**

Fetch status on page load. When an unread eligible article opens, start a server session and use its returned session ID; display a 20-second timer for user feedback. Track scroll-to-end on the actual article content and enable the button only when both client gates pass. Submit only the session ID; use the server response for the result. Reopening starts a new session. Videos and matrix rows do not start a reading session.

- [ ] **Step 5: Implement result and daily-cap UI**

On `AWARDED`, show `+5 SAB-Points`, add the article to `Read ✓`, and refresh status and the points summary. On `ALREADY_READ`, show the read badge without another success award. On `DAILY_LIMIT_REACHED`, show the exact agreed message, consume/clear the current session, and require the resident to close and reopen the article for a fresh qualifying read on a later day; keep the article unread until an award is recorded. Show today's `n / 3` count. Since the current catalog has exactly three eligible articles and each is one-time, the daily-cap message is defensive/future-compatible and is not reachable with only the current article set. Replace any inaccurate broad “earn points while reading” banner copy with the exact rule, 3/day maximum, and once-per-article limit.

- [ ] **Step 6: Run focused tests and TypeScript check**

Run: `cd apps\web; cmd.exe /c npm test -- tests/AwarenessHub.test.tsx`
Expected: PASS.
Run: `cd apps\web; cmd.exe /c npx tsc --noEmit`
Expected: exit code 0.

### Task 3: Full Verification and Handoff

**Files:**
- Verify: all changed backend and frontend files from Tasks 1–2
- Verify: `apps/api/alembic/versions/0012_awareness_article_reading.py`
- Verify: `docs/superpowers/specs/2026-11-01-awareness-article-reading-points-design.md`

**Interfaces:**
- Consumes: the complete article reading reward API and Awareness Hub flow from Tasks 1–2.
- Produces: verified tests, build, migration head, and clean diff checks; no commit unless explicitly requested.

- [ ] **Step 1: Run the complete backend test suite**

Run: `cd apps\api; .\.venv\Scripts\python.exe -m pytest tests -v`
Expected: all tests pass; report any existing warnings separately.

- [ ] **Step 2: Run the complete frontend test suite**

Run: `cd apps\web; cmd.exe /c npm test`
Expected: all Vitest files and tests pass.

- [ ] **Step 3: Run the production frontend build**

Run: `cd apps\web; cmd.exe /c npm run build`
Expected: exit code 0.

- [ ] **Step 4: Verify migration chain and diff**

Run: `cd apps\api; .\.venv\Scripts\python.exe -m alembic heads`
Expected: one head at `0012_awareness_article_reading`.
Run: `git diff --check`
Expected: exit code 0; existing unrelated modifications remain untouched.

## Self-review

- **Spec coverage:** The user-stated timer, end-scroll, explicit action, fixed award, per-article uniqueness, server timestamp, daily cap, next-day reread, read badge, success feedback, and accurate banner are covered in Tasks 1–2. Migration, auth/CSRF, ledger audit, browser scroll boundary, and complete suites are covered.
- **Step scan:** Each task uses a failing test, implementation, focused pass, and regression/full validation. No product code is changed by the plan itself.
- **Type consistency:** The three named service functions and response types are used consistently by endpoint contracts and frontend helpers. Daily-limit and already-read results are explicit.
- **Review focus:** All five identified failure modes map to Task 1 or Task 2 tests.
- **Proportion:** Three tasks separate backend persistence/security, the UI consumer, and whole-change verification; no unrelated subsystem is added.
