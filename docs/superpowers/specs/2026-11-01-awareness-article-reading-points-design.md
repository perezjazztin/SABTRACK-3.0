# Awareness Hub Article Reading Rewards Design

## Intent

Reward residents for reading the Awareness Hub's environmental articles with SAB-Points, while making the reward one-time per article and limiting farming. The existing Awareness Hub is a resident-facing page with a client-side article catalog and reader modal; balances are derived from the backend points ledger.

## Goals

- Award 5 SAB-Points after a resident reads an eligible article for at least 20 seconds, reaches the end of its content, and selects **Mark as Read**.
- Validate the elapsed time on the server from a server-recorded article-open session. The browser timer is only a progress display.
- Award points no more than once for the same resident and article. Persist that rule with a unique database constraint on `(resident_id, article_id)`.
- Limit residents to three article-reading rewards per Philippine calendar day (15 points maximum).
- If an unawarded eligible article is attempted after the daily limit is reached, allow reading but do not complete/award that article. Explain: “You’ve reached today’s reading limit. Come back tomorrow to earn 5 SAB-Points for this article.” The resident must open it again and reread it on a later day. This state is forward-compatible: the current three article catalog has no unread eligible article left once all three daily awards are earned.
- Show completed article badges, the +5 confirmation, the daily count, and the award rule in the Awareness Hub.
- Include reading awards in the existing SAB-Points balance and ledger history.
- Keep the three current eligible articles; do not add another article or make video synopses eligible to earn points.

## Non-goals

- Award points for videos, the segregation matrix, time spent outside an open article modal, or articles not in the Awareness Hub's supported article list.
- Track comprehension quizzes, collect reading analytics, or claim that browser-reported scroll position is tamper-proof.
- Permit repeat rewards for an already-awarded article, even on a later day.
- Add new article content as part of this feature.

## Constraints

- PostgreSQL remains the primary database. All schema changes use an Alembic migration. Pytest retains its in-memory SQLite `StaticPool` fixture.
- The backend points ledger remains the source of truth for balances and audit history. Reading awards are positive ledger entries and use an explicit transaction type.
- Reading endpoints require an authenticated `RESIDENT` session. Respect existing CSRF protection for state-changing requests.
- The server accepts only stable article IDs explicitly registered as eligible. Current article IDs are `article-sdgs-sabtrack`, `article-ra-9003`, and `article-home-composting`; videos and matrix entries do not earn points.
- Keep the current catalog at those three eligible articles; do not add an article or reward video synopsis views. The daily limit remains an enforced safeguard for future eligible articles; with only three current articles, completing all three also completes the currently available article rewards.
- Daily limits use the `Asia/Manila` calendar date and must remain correct under concurrent completion requests.
- Preserve the current modal and site design, keeping all unrelated workspace changes intact.

## Approaches

1. **Server-tracked reading session (selected).** On article open, the backend records the resident, article, open time, and an opaque session identifier. Completion submits that identifier; the backend validates elapsed time, the unique-award rule, and the daily cap before recording the award and ledger entry in one transaction. The frontend gates the button on elapsed time and scroll-to-end for usability. This makes the time, cap, identity, and points authoritative on the server.
2. **Browser-tracked progress with a backend award request.** The page tracks open time and scroll position, then requests points when the button is tapped. It is less work but cannot authoritatively establish that the 20 seconds passed and is easier to tamper with; it does not meet the requested server-side time validation.

The user selected approach 1. The proposed visual states are shown in [the article-reading mockup](../../.superpowers/brainstorm/1399-1793534749/content/article-reading-award-flow.html).

## Design and behavior

### Persistence and API

- Add a server-side reading-session record keyed by an opaque session ID and associated with resident, eligible article ID, server-generated `opened_at`, and consumed state. A session does not expire by time. Reopening the same unfinished article replaces its prior session, so only the latest open is valid across tabs/devices. A session is accepted only for its owner and article.
- Add an article-award record with resident ID, article ID, awarded time, and ledger-entry reference. Enforce a unique constraint on `(resident_id, article_id)`. Write this record and its positive ledger entry atomically.
- Add `ARTICLE_READ_AWARD` to the string-backed ledger transaction type. Ledger entries record 5 points and a stable article-specific description/source.
- Provide authenticated endpoints to start a reading session, retrieve a resident's completed article IDs and today's reward count, and complete a session. Completion checks the article allowlist, session ownership, server-measured elapsed time of at least 20 seconds, unique award, and today's limit under a resident-level lock. On success, insert the award and ledger entry in the same transaction.
- A completion request before 20 seconds returns a clear retryable client error and creates no award. A daily-cap response is distinguishable so the page can show the agreed notice; it creates no completion record or points and consumes that session. The resident must open the article again and complete a fresh session on a later day. A repeated request for an already-awarded article returns an already-completed result without another ledger entry.
- The backend cannot observe browser scrolling. The page enables **Mark as Read** only after its content panel reaches the end and 20 seconds have elapsed; the server independently validates all enforceable conditions. Scroll state is not represented as a security guarantee.

### Awareness Hub

- Update the banner so it accurately explains: eligible articles earn 5 points after at least 20 seconds, reaching the end, and selecting **Mark as Read**, up to three articles per day; an article pays only once.
- On opening an eligible article, request a reading session and show elapsed-time progress. Track scrolling to the end of the actual article content; enable the completion button only when both client-side conditions are met.
- Show **Read ✓** for awards already recorded by the backend. On a successful new award, show **+5 SAB-Points**, refresh the completion list and points view, and avoid awarding again if the modal is reopened.
- When a resident has three awards for the Philippine calendar day, any still-unawarded eligible article remains readable but is not marked complete. Show the agreed daily-limit message and require a new full reading session on a later day to earn the article's one-time award. With today's three-article catalog, all articles are already completed if all three daily awards have been earned; the message applies when the eligible catalog grows.
- Articles not already read on a previous date remain eligible on a later date after a new qualifying session. The unique award record is written only on successful earning.

### Verification

- Backend tests cover valid and early completion, unauthenticated access, unsupported article IDs, repeated completion, one award per resident/article, the three-per-day limit and next-day eligibility, and concurrent/double completion without duplicate ledger entries.
- Frontend tests cover the modal timer, scroll gate, enabled/disabled button, read badge, success feedback, daily-limit text, and refresh of points after a successful award.
- Run backend and frontend test suites, frontend production build, migration-chain checks, and diff checks.

## Builder decisions

- Use the project's established timestamp conventions for persisted times and compute daily counts in `Asia/Manila`.
- Keep the article allowlist in backend code synchronized with the stable Awareness Hub article IDs; do not build a general content-management system.
- The user chose sessions with no time-based expiry; reopening an unfinished article replaces the earlier session.
- Exact HTTP status codes and whether to package the completion status endpoint with existing points summary are implementation choices, provided success, early completion, already-awarded, and daily-cap outcomes remain unambiguous to the frontend.
